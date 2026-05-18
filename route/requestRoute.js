import express from "express";
import multer from "multer";
import pkg from 'multer-storage-cloudinary';
const CloudinaryStorage = pkg; // v2.x style, no destructuring
import cloudinary from "../Files/cloudinary.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";
import Request from "../model/request_model.js";
import {
  submitRequest,
  getRequestsByOrphan,
  getRequestsByOrphanage,
  getAllRequests,
  updateRequestStatus,
  rejectRequest
} from "../controllers/requestController.js";

const router = express.Router();

// Cloudinary storage for request documents (v2.x)
const storage = CloudinaryStorage({
  cloudinary,
  folder: "request_documents", // direct property, no params object
  resource_type: "auto",
});

const upload = multer({ storage });

// Submit new request
router.post("/submit", upload.array("documents"), submitRequest);

// Get requests by orphan
router.get("/orphan/:orphanId", getRequestsByOrphan);

// Get requests by orphanage
router.get("/orphanage/:orphanageId", getRequestsByOrphanage);

// Get all requests (admin)
router.get("/", getAllRequests);

// Update request status (Allow donor/admin)
router.put("/:requestId/status", authenticateToken, updateRequestStatus);

// Reject/Dismiss request for specific donor
router.put("/:requestId/reject", authenticateToken, rejectRequest);

// Get approved requests for donors
router.get("/approved", async (req, res) => {
  try {
    const requests = await Request.find({ status: { $in: ['approved', 'pending'] } })
      .populate('orphanId', 'name age gender location')
      .populate('orphanageId', 'name location')
      .sort({ isUrgent: -1, createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved requests', error: error.message });
  }
});

export default router;
