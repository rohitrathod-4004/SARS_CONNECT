import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMembers,
  removeMember,
  leaveGroup,
  updateGroup,
  deleteGroup
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:id", protectRoute, getGroupById);
router.put("/:id", protectRoute, updateGroup);
router.delete("/:id", protectRoute, deleteGroup);
router.post("/:id/members", protectRoute, addMembers);
router.delete("/:id/members/:memberId", protectRoute, removeMember);
router.post("/:id/leave", protectRoute, leaveGroup);

export default router;
