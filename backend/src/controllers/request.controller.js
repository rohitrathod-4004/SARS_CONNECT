import ConversationRequest from "../models/conversationRequest.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Send a chat request
export const sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent self-requests
    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ error: "Cannot send request to yourself" });
    }

    // Check if request already exists
    let existingRequest = await ConversationRequest.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingRequest) {
      // If request exists and is pending, return it
      if (existingRequest.status === "pending") {
        return res.status(200).json({
          success: true,
          data: existingRequest,
          message: "Request already exists",
        });
      }
      // If rejected or cancelled, allow creating a new request
      if (existingRequest.status === "rejected" || existingRequest.status === "cancelled") {
        existingRequest.status = "pending";
        existingRequest.requester = requesterId;
        existingRequest.recipient = recipientId;
        existingRequest.updatedAt = Date.now();
        await existingRequest.save();
        
        await existingRequest.populate("requester", "fullName email profilePic");
        await existingRequest.populate("recipient", "fullName email profilePic");

        // Emit socket event to recipient
        const recipientSocketId = getReceiverSocketId(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("request:sent", existingRequest);
        }

        return res.status(200).json({ success: true, data: existingRequest });
      }
      // If accepted, conversation already exists
      if (existingRequest.status === "accepted") {
        return res.status(409).json({ error: "Conversation already exists" });
      }
    }

    // Check if there are existing messages (for backward compatibility)
    const existingMessages = await Message.findOne({
      $or: [
        { senderId: requesterId, receiverId: recipientId },
        { senderId: recipientId, receiverId: requesterId },
      ],
    });

    // If messages exist, auto-create accepted request
    if (existingMessages) {
      const autoAcceptedRequest = new ConversationRequest({
        requester: requesterId,
        recipient: recipientId,
        status: "accepted",
      });
      await autoAcceptedRequest.save();
      await autoAcceptedRequest.populate("requester", "fullName email profilePic");
      await autoAcceptedRequest.populate("recipient", "fullName email profilePic");
      
      return res.status(200).json({
        success: true,
        data: autoAcceptedRequest,
        message: "Conversation already active",
      });
    }

    // Create new request
    const newRequest = new ConversationRequest({
      requester: requesterId,
      recipient: recipientId,
    });

    await newRequest.save();
    await newRequest.populate("requester", "fullName email profilePic");
    await newRequest.populate("recipient", "fullName email profilePic");

    // Emit socket event to recipient
    const recipientSocketId = getReceiverSocketId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("request:sent", newRequest);
    }

    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    console.error("Error in sendRequest controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get incoming requests for current user
export const getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await ConversationRequest.find({
      recipient: userId,
      status: "pending",
    })
      .populate("requester", "fullName email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error in getIncomingRequests controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get outgoing requests for current user
export const getOutgoingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await ConversationRequest.find({
      requester: userId,
      status: "pending",
    })
      .populate("recipient", "fullName email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error in getOutgoingRequests controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Accept a chat request
export const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await ConversationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Only recipient can accept
    if (request.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Forbidden: Only recipient can accept" });
    }

    // Check if already accepted
    if (request.status !== "pending") {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    // Update request status
    request.status = "accepted";
    request.updatedAt = Date.now();
    await request.save();

    await request.populate("requester", "fullName email profilePic");
    await request.populate("recipient", "fullName email profilePic");

    // Emit socket events to both users
    const requesterSocketId = getReceiverSocketId(request.requester._id);
    const recipientSocketId = getReceiverSocketId(request.recipient._id);

    if (requesterSocketId) {
      io.to(requesterSocketId).emit("request:accepted", request);
    }
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("request:accepted", request);
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error in acceptRequest controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reject a chat request
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await ConversationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Only recipient can reject
    if (request.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Forbidden: Only recipient can reject" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    request.status = "rejected";
    request.updatedAt = Date.now();
    await request.save();

    await request.populate("requester", "fullName email profilePic");
    await request.populate("recipient", "fullName email profilePic");

    // Emit socket event to requester
    const requesterSocketId = getReceiverSocketId(request.requester._id);
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("request:updated", request);
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error in rejectRequest controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cancel a chat request
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await ConversationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Only requester can cancel
    if (request.requester.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Forbidden: Only requester can cancel" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    request.status = "cancelled";
    request.updatedAt = Date.now();
    await request.save();

    await request.populate("requester", "fullName email profilePic");
    await request.populate("recipient", "fullName email profilePic");

    // Emit socket event to recipient
    const recipientSocketId = getReceiverSocketId(request.recipient._id);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("request:updated", request);
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error in cancelRequest controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get request status between two users
export const getRequestStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const request = await ConversationRequest.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId },
      ],
    })
      .populate("requester", "fullName email profilePic")
      .populate("recipient", "fullName email profilePic");

    if (!request) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error in getRequestStatus controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
