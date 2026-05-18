import express from "express";
import { createOrphanAge, getOrphanages, getOrphanageProfile } from "../controllers/orphan_agecontroller.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  upload.any(),
  createOrphanAge
);

router.get("/all", getOrphanages);
router.get("/profile/:userId", getOrphanageProfile);

export default router;
