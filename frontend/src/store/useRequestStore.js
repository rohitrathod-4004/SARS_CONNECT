import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useRequestStore = create((set, get) => ({
  incomingRequests: [],
  outgoingRequests: [],
  isLoading: false,
  requestStatus: {}, // { userId: requestObject }

  // Send a chat request
  sendRequest: async (recipientId) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/requests", { recipientId });
      
      if (res.data.success) {
        // Add to outgoing requests if pending
        if (res.data.data.status === "pending") {
          set((state) => ({
            outgoingRequests: [res.data.data, ...state.outgoingRequests],
          }));
          toast.success("Chat request sent!");
        } else if (res.data.data.status === "accepted") {
          toast.success(res.data.message || "Conversation already active");
        }
        
        // Update request status cache
        set((state) => ({
          requestStatus: {
            ...state.requestStatus,
            [recipientId]: res.data.data,
          },
        }));
        
        return res.data.data;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to send request";
      toast.error(errorMsg);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch incoming requests
  fetchIncomingRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/requests/incoming");
      if (res.data.success) {
        set({ incomingRequests: res.data.data });
      }
    } catch (error) {
      console.error("Error fetching incoming requests:", error);
      toast.error("Failed to load incoming requests");
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch outgoing requests
  fetchOutgoingRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/requests/outgoing");
      if (res.data.success) {
        set({ outgoingRequests: res.data.data });
      }
    } catch (error) {
      console.error("Error fetching outgoing requests:", error);
      toast.error("Failed to load outgoing requests");
    } finally {
      set({ isLoading: false });
    }
  },

  // Get request status for a specific user
  getRequestStatus: async (userId) => {
    // Check cache first
    const cached = get().requestStatus[userId];
    if (cached) return cached;

    try {
      const res = await axiosInstance.get(`/requests/status/${userId}`);
      if (res.data.success && res.data.data) {
        set((state) => ({
          requestStatus: {
            ...state.requestStatus,
            [userId]: res.data.data,
          },
        }));
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching request status:", error);
      return null;
    }
  },

  // Accept a request
  acceptRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post(`/requests/${requestId}/accept`);
      if (res.data.success) {
        // Remove from incoming requests
        set((state) => ({
          incomingRequests: state.incomingRequests.filter((req) => req._id !== requestId),
        }));
        
        // Update request status cache
        const request = res.data.data;
        const otherUserId = request.requester._id;
        set((state) => ({
          requestStatus: {
            ...state.requestStatus,
            [otherUserId]: request,
          },
        }));
        
        toast.success("Chat request accepted!");
        return res.data.data;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to accept request";
      toast.error(errorMsg);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Reject a request
  rejectRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post(`/requests/${requestId}/reject`);
      if (res.data.success) {
        // Remove from incoming requests
        set((state) => ({
          incomingRequests: state.incomingRequests.filter((req) => req._id !== requestId),
        }));
        toast.success("Chat request rejected");
        return res.data.data;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to reject request";
      toast.error(errorMsg);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Cancel a request
  cancelRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post(`/requests/${requestId}/cancel`);
      if (res.data.success) {
        // Remove from outgoing requests
        set((state) => ({
          outgoingRequests: state.outgoingRequests.filter((req) => req._id !== requestId),
        }));
        
        // Clear from request status cache
        const request = res.data.data;
        const otherUserId = request.recipient._id;
        set((state) => {
          const newStatus = { ...state.requestStatus };
          delete newStatus[otherUserId];
          return { requestStatus: newStatus };
        });
        
        toast.success("Chat request cancelled");
        return res.data.data;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to cancel request";
      toast.error(errorMsg);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Socket event handlers
  handleRequestSent: (request) => {
    set((state) => ({
      incomingRequests: [request, ...state.incomingRequests],
    }));
    
    // Show toast notification
    toast.success(`New chat request from ${request.requester.fullName}`, {
      duration: 4000,
    });
  },

  handleRequestUpdated: (request) => {
    // Update incoming or outgoing requests based on status
    set((state) => {
      const newIncoming = state.incomingRequests.filter((req) => req._id !== request._id);
      const newOutgoing = state.outgoingRequests.filter((req) => req._id !== request._id);
      
      return {
        incomingRequests: newIncoming,
        outgoingRequests: newOutgoing,
      };
    });
    
    // Show notification
    if (request.status === "rejected") {
      toast.error("Your chat request was rejected");
    } else if (request.status === "cancelled") {
      toast("Chat request was cancelled");
    }
  },

  handleRequestAccepted: (request) => {
    const authUser = useAuthStore.getState().authUser;
    
    // Remove from both lists
    set((state) => ({
      incomingRequests: state.incomingRequests.filter((req) => req._id !== request._id),
      outgoingRequests: state.outgoingRequests.filter((req) => req._id !== request._id),
    }));
    
    // Update request status cache
    const otherUserId = request.requester._id === authUser._id 
      ? request.recipient._id 
      : request.requester._id;
    
    set((state) => ({
      requestStatus: {
        ...state.requestStatus,
        [otherUserId]: request,
      },
    }));
    
    // Show notification
    if (request.requester._id !== authUser._id) {
      // We accepted someone's request
      toast.success(`You can now chat with ${request.requester.fullName}`);
    } else {
      // Someone accepted our request
      toast.success(`${request.recipient.fullName} accepted your chat request!`);
    }
  },

  // Subscribe to socket events
  subscribeToSocketEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("request:sent", get().handleRequestSent);
    socket.on("request:updated", get().handleRequestUpdated);
    socket.on("request:accepted", get().handleRequestAccepted);
  },

  // Unsubscribe from socket events
  unsubscribeFromSocketEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("request:sent", get().handleRequestSent);
    socket.off("request:updated", get().handleRequestUpdated);
    socket.off("request:accepted", get().handleRequestAccepted);
  },
}));
