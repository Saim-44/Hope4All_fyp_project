import express from "express";
import multer from "multer";
import pkg from "multer-storage-cloudinary";
const CloudinaryStorage = pkg;
import cloudinary from "../Files/cloudinary.js";
import { registerOrphan, getOrphanProfile, updateOrphanProfile, confirmReceipt, reportDonationIssue } from "../controllers/orphanController.js";

const router = express.Router();

// Cloudinary + Multer storage setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "orphan_data",
    resource_type: "auto",
  },
});


const upload = multer({ storage });

// Route to register orphan
router.post(
  "/register",
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "supportingDocs", maxCount: 1 },
    { name: "bFormDoc", maxCount: 1 },
  ]),
  registerOrphan
);

// Route to get orphan profile
router.get("/profile/:id", getOrphanProfile);

// Route to update orphan profile
router.put(
  "/profile/:id",
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "supportingDocs", maxCount: 1 },
    { name: "bFormDoc", maxCount: 1 },
  ]),
  updateOrphanProfile
);

// Route to confirm donation receipt
router.put("/donations/:donationId/confirm", upload.single('receivedImage'), confirmReceipt);

// Route to report donation issue
router.put("/donations/:donationId/report", reportDonationIssue);

export default router;
