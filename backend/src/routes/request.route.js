import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getRequestStatus,
} from "../controllers/request.controller.js";

const router = express.Router();

// All routes require authentication
router.post("/", protectRoute, sendRequest);
router.get("/incoming", protectRoute, getIncomingRequests);
router.get("/outgoing", protectRoute, getOutgoingRequests);
router.get("/status/:userId", protectRoute, getRequestStatus);
router.post("/:id/accept", protectRoute, acceptRequest);
router.post("/:id/reject", protectRoute, rejectRequest);
router.post("/:id/cancel", protectRoute, cancelRequest);

export default router;
