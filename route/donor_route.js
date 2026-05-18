
import express from "express";
import {
  registerDonor,
  registerDonorWithFiles,
  getDonors,
  getDonorProfile,
  updateDonorProfile,
  makeDonation,
  getDonationHistory,
  getDonorOrphans,
  updateDonation,
  deleteDonation,
  getNotifications,
  markNotificationRead,
  getMatchedOrphans,
  getPreferenceOptions,
  getOrphanAid,
  deleteDonor,
  approveDonor,
  rejectDonor,
  uploadDonationPhoto
} from "../controllers/donorController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();


// Route to register a donor
router.post("/register", registerDonor);

// Route to register a donor with file uploads
router.post("/register-with-files", upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]), registerDonorWithFiles);

// Route to get all donors
router.get("/", getDonors);

// Route to get donor profile
router.get("/profile/:id", getDonorProfile);

// Route to update donor profile
router.put("/profile/:id", upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]), updateDonorProfile);

// Route to make a donation
router.post("/donate", makeDonation);

// Route to get donation history
router.get("/history/:id", getDonationHistory);

// Route to get orphans donor has donated to
router.get("/orphans/:id", getDonorOrphans);

// Route to update donation
router.put("/donation/:donationId", updateDonation);

// Route to upload donation delivery photo
router.post("/donation/:donationId/photo", upload.single('photo'), uploadDonationPhoto);

// Route to delete donation
router.delete("/donation/:donationId", deleteDonation);

// Route to get notifications
router.get("/notifications/:id", getNotifications);

// Route to mark notification as read
router.put("/notifications/:notificationId/read", markNotificationRead);

// Route to get matched orphans
router.get("/matched-orphans/:id", getMatchedOrphans);


// Route to get preference options
router.get("/preferences/options", getPreferenceOptions);

// Route to get aid received by an orphan
router.get("/aid/:id", getOrphanAid);

// Route to get donor by user ID (for checking profile existence)
router.get("/user/:userId", getDonorProfile);

// Route to delete donor
router.delete("/:id", deleteDonor);

// Admin: Approve a donor
router.put("/approve/:id", approveDonor);

// Admin: Reject a donor
router.put("/reject/:id", rejectDonor);

export default router;
