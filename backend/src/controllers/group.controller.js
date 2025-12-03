import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Ensure admin is in members list
    const uniqueMembers = [...new Set([adminId.toString(), ...(memberIds || [])])];

    const newGroup = new Group({
      name,
      description,
      admin: adminId,
      members: uniqueMembers
    });

    await newGroup.save();
    await newGroup.populate('members', '-password');
    await newGroup.populate('admin', '-password');

    res.status(201).json(newGroup);
  } catch (error) {
    console.log("Error in createGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all groups for current user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      members: userId,
      isActive: true
    })
      .populate('members', '-password')
      .populate('admin', '-password')
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getUserGroups controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single group details
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id)
      .populate('members', '-password')
      .populate('admin', '-password');

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in getGroupById controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add members to group
export const addMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can add members
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Add new members (avoid duplicates)
    const newMembers = memberIds.filter(
      memberId => !group.members.includes(memberId)
    );

    group.members.push(...newMembers);
    await group.save();
    await group.populate('members', '-password');
    await group.populate('admin', '-password');

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in addMembers controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove member from group
export const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can remove members
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Cannot remove admin
    if (memberId === group.admin.toString()) {
      return res.status(400).json({ message: "Cannot remove group admin" });
    }

    group.members = group.members.filter(
      member => member.toString() !== memberId
    );

    await group.save();
    await group.populate('members', '-password');
    await group.populate('admin', '-password');

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in removeMember controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Admin cannot leave (must transfer admin first or delete group)
    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({ 
        message: "Admin cannot leave. Transfer admin rights or delete group" 
      });
    }

    group.members = group.members.filter(
      member => member.toString() !== userId.toString()
    );

    await group.save();

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.log("Error in leaveGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update group info
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, groupPic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can update group
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can update group" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      group.groupPic = uploadResponse.secure_url;
    }

    await group.save();
    await group.populate('members', '-password');
    await group.populate('admin', '-password');

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in updateGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete group
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can delete group
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    group.isActive = false;
    await group.save();

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
