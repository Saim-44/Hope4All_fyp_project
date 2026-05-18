import express from "express";
import { 
  addCourse, 
  getApprovedCourses, 
  getPendingCourses, 
  updateCourseStatus,
  getDonorCourses
} from "../controllers/courseController.js";

const router = express.Router();

router.post("/add", addCourse);
router.get("/approved", getApprovedCourses);
router.get("/pending", getPendingCourses);
router.put("/:id/status", updateCourseStatus);
router.get("/donor/:donorId", getDonorCourses);

export default router;
