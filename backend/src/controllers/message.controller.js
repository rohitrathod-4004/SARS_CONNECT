import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import ConversationRequest from "../models/conversationRequest.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, getGroupSocketIds, io } from "../lib/socket.js";

// Get users with accepted chat requests (for sidebar)
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Find all accepted requests where user is either requester or recipient
    const acceptedRequests = await ConversationRequest.find({
      $or: [
        { requester: loggedInUserId, status: "accepted" },
        { recipient: loggedInUserId, status: "accepted" },
      ],
    });

    // Extract user IDs from accepted requests
    const userIds = acceptedRequests.map((request) => {
      return request.requester.toString() === loggedInUserId.toString()
        ? request.recipient
        : request.requester;
    });

    // Also include users with existing messages (backward compatibility)
    const messagesWithUsers = await Message.find({
      $or: [
        { senderId: loggedInUserId },
        { receiverId: loggedInUserId },
      ],
    }).distinct("senderId");

    const messagesWithUsers2 = await Message.find({
      $or: [
        { senderId: loggedInUserId },
        { receiverId: loggedInUserId },
      ],
    }).distinct("receiverId");

    const allUserIds = [...new Set([...userIds, ...messagesWithUsers, ...messagesWithUsers2])];
    
    // Remove current user ID
    const filteredUserIds = allUserIds.filter(id => id.toString() !== loggedInUserId.toString());

    // Fetch user details
    const users = await User.find({ _id: { $in: filteredUserIds } }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search users by email
export const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    const loggedInUserId = req.user._id;

    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "Email query is required" });
    }

    // Search for users by email (case-insensitive, partial match)
    const users = await User.find({
      email: { $regex: email, $options: "i" },
      _id: { $ne: loggedInUserId }, // Exclude current user
    })
      .select("-password")
      .limit(10); // Limit results to 10

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Check if chat request exists and is accepted
    const chatRequest = await ConversationRequest.findOne({
      $or: [
        { requester: senderId, recipient: receiverId },
        { requester: receiverId, recipient: senderId },
      ],
    });

    // If no request exists, check for existing messages (backward compatibility)
    if (!chatRequest) {
      const existingMessages = await Message.findOne({
        $or: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });

      // If no existing messages, require a chat request
      if (!existingMessages) {
        return res.status(403).json({
          error: "Chat request not sent",
          message: "Please send a chat request first before messaging",
        });
      }
      // If existing messages found, auto-create accepted request for backward compatibility
      const autoRequest = new ConversationRequest({
        requester: senderId,
        recipient: receiverId,
        status: "accepted",
      });
      await autoRequest.save();
    } else if (chatRequest.status !== "accepted") {
      // Request exists but not accepted
      return res.status(403).json({
        error: "Chat request not accepted",
        message: "Wait for the recipient to accept your chat request",
      });
    }

    let imageUrl;
    let videoUrl;
    
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    
    if (video) {
      // Upload base64 video to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
      });
      videoUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const messages = await Message.find({
      groupId: groupId,
      messageType: "group"
    })
      .populate('senderId', '-password')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send group message
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    let imageUrl;
    let videoUrl;
    
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    
    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
      });
      videoUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      messageType: "group",
      text,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();
    await newMessage.populate('senderId', '-password');

    // Emit to all group members via Socket.IO
    const memberSocketIds = getGroupSocketIds(group.members);
    
    memberSocketIds.forEach(socketId => {
      io.to(socketId).emit("newGroupMessage", newMessage);
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

