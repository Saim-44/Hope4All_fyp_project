import express from "express";
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  getReportsData,
  getNotifications,
  markNotificationRead,
  getAllOrphans,
  getAllDonors,
  getAllOrphanages,
  getAllVolunteers,
  getOrphanById,
  getDonorById,
  getOrphanageById,
  getVolunteerById,
  testEndpoint,
  getAllDonations,
  suspendUser,
  unsuspendUser,
  forwardDonation,
  completeDonation,
  updateDonationStatus,
  deleteUser
} from "../controllers/adminController.js";

const router = express.Router();

// Get dashboard statistics
router.get("/stats", getDashboardStats);

// Get all users
router.get("/users", getUsers);

// Get user by ID
router.get("/users/:userId", getUserById);

// Update user status
router.put("/users/:userId/status", updateUserStatus);

// Get reports and analytics data
router.get("/reports", getReportsData);

// Get notifications
router.get("/notifications", getNotifications);

// Mark notification as read
router.put("/notifications/:notificationId/read", markNotificationRead);

// Get all orphans
router.get("/orphans", getAllOrphans);

// Get all donors
router.get("/donors", getAllDonors);

// Get all orphanages
router.get("/orphanages", getAllOrphanages);

// Get all volunteers
router.get("/volunteers", getAllVolunteers);

// Get orphan by ID
router.get("/orphans/:id", getOrphanById);

// Get donor by ID
router.get("/donors/:id", getDonorById);

// Get orphanage by ID
router.get("/orphanages/:id", getOrphanageById);

// Get volunteer by ID
router.get("/volunteers/:id", getVolunteerById);

// Get all donations
router.get("/donations", getAllDonations);

// Suspend a user with a reason
router.put("/users/:userId/suspend", suspendUser);

// Unsuspend a user
router.put("/users/:userId/unsuspend", unsuspendUser);

// Forward donation to orphan
router.put("/donations/:donationId/forward", forwardDonation);

// Mark donation as completed
router.put("/donations/:donationId/complete", completeDonation);

// Update donation status (general)
router.put("/donations/:donationId/status", updateDonationStatus);

// Delete user
router.delete("/users/:userId", deleteUser);

// Test endpoint
router.get("/test", testEndpoint);

export default router;
