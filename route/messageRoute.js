import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesRead
} from "../controllers/messageController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

import pkg from "multer-storage-cloudinary";
const CloudinaryStorage = pkg;
import cloudinary from "../Files/cloudinary.js";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_media",
    resource_type: "auto",
  },
});

const upload = multer({ storage });

const router = express.Router();

// Protect all message routes
router.use(authenticateToken);

// Send message (HTTP fallback, prefer Socket.io)
router.post("/", upload.single('file'), sendMessage);

// Get messages with specific user
router.get("/:otherUserId", getMessages);

// Get all conversations
router.get("/", getConversations);

// Mark messages as read
router.put("/:otherUserId/read", markMessagesRead);

export default router;

