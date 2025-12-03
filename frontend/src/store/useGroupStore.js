import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  // Get all user's groups
  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
      
      // Join all group rooms via Socket.IO
      const socket = useAuthStore.getState().socket;
      if (socket) {
        const groupIds = res.data.map(group => group._id);
        socket.emit("joinGroups", groupIds);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // Create new group
  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set({ groups: [res.data, ...get().groups] });
      
      // Join the new group room
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("joinGroups", [res.data._id]);
      }
      
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  // Get group messages
  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/group/${groupId}`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // Send group message
  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/group/send/${selectedGroup._id}`,
        messageData
      );
      set({ groupMessages: [...groupMessages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Subscribe to group messages
  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newGroupMessage", (newMessage) => {
      const { selectedGroup, groupMessages } = get();
      
      // Only update if message is for the currently selected group
      if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        set({ groupMessages: [...groupMessages, newMessage] });
      }
    });
  },

  // Unsubscribe from group messages
  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newGroupMessage");
    }
  },

  // Update group
  updateGroup: async (groupId, updateData) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, updateData);
      set({
        groups: get().groups.map(g => g._id === groupId ? res.data : g),
        selectedGroup: res.data
      });
      toast.success("Group updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
    }
  },

  // Add members
  addMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { memberIds });
      set({
        groups: get().groups.map(g => g._id === groupId ? res.data : g),
        selectedGroup: res.data
      });
      toast.success("Members added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
    }
  },

  // Leave group
  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set({
        groups: get().groups.filter(g => g._id !== groupId),
        selectedGroup: null
      });
      
      // Leave the group room
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("leaveGroup", groupId);
      }
      
      toast.success("Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  },

  // Delete group
  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      set({
        groups: get().groups.filter(g => g._id !== groupId),
        selectedGroup: null
      });
      toast.success("Group deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    }
  },

  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
}));
