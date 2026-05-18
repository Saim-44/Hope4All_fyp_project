import express from "express";
import {
  createTask,
  getTasksByVolunteer,
  getAllTasks,
  updateTaskStatus,
  getVolunteerStats
} from "../controllers/taskController.js";

import pkg from "multer-storage-cloudinary";
const CloudinaryStorage = pkg;
import cloudinary from "../Files/cloudinary.js";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "task_proofs",
    resource_type: "auto",
  },
});

const upload = multer({ storage });

const router = express.Router();

// Create new task (admin)
router.post("/", createTask);

// Get tasks by volunteer
router.get("/volunteer/:volunteerId", getTasksByVolunteer);

// Get all tasks (admin)
router.get("/", getAllTasks);

// Update task status
router.put("/:taskId/status", upload.single('proofImage'), updateTaskStatus);

// Get volunteer stats
router.get("/stats/:volunteerId", getVolunteerStats);

export default router;
