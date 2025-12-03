import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  getGroupMessages,
  sendGroupMessage,
  searchUsers,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchUsers);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

// Group message routes
router.get("/group/:groupId", protectRoute, getGroupMessages);
router.post("/group/:groupId", protectRoute, sendGroupMessage);

export default router;
