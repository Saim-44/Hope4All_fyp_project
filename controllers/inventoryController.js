import Inventory from '../model/inventory_model.js';
import Notification from '../model/notification_model.js';

export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ lastUpdated: -1 });
    res.status(200).json({ inventory });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

export const addInventoryItem = async (req, res) => {
  try {
    const { item, category, quantity, minThreshold, supplier, unitPrice, location, expiryDate } = req.body;

    const newItem = new Inventory({
      item,
      category,
      quantity,
      minThreshold,
      supplier,
      unitPrice,
      location,
      expiryDate,
    });

    await newItem.save();
    res.status(201).json({ message: 'Inventory item added successfully', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Error adding inventory item', error: error.message });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const { quantity, minThreshold, supplier, unitPrice, location, expiryDate } = req.body;

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.itemId,
      {
        quantity,
        minThreshold,
        supplier,
        unitPrice,
        location,
        expiryDate,
        lastUpdated: Date.now()
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check for low stock
    if (updatedItem.quantity <= updatedItem.minThreshold) {
      const notification = new Notification({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${updatedItem.item} is below minimum threshold (${updatedItem.quantity} remaining)`,
      });
      await notification.save();
    }

    res.status(200).json({ message: 'Inventory item updated', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.itemId);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$minThreshold'] }
    });

    res.status(200).json({ lowStockItems });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};
