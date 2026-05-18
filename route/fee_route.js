import express from "express";
import { createFee, getOrphanFees, getAvailableFees, pledgeFee, deleteFee } from "../controllers/fee_controller.js";

const router = express.Router();

router.post("/create", createFee);
router.get("/orphan/:orphanId", getOrphanFees);
router.get("/available", getAvailableFees);
router.post("/pledge/:feeId", pledgeFee);
router.delete("/delete/:feeId", deleteFee);

export default router;
