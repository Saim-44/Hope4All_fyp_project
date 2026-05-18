import express from "express";
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems
} from "../controllers/inventoryController.js";

const router = express.Router();

// Get all inventory items
router.get("/", getInventory);

// Add new inventory item
router.post("/", addInventoryItem);

// Update inventory item
router.put("/:itemId", updateInventoryItem);

// Delete inventory item
router.delete("/:itemId", deleteInventoryItem);

// Get low stock items
router.get("/low-stock", getLowStockItems);

export default router;
