import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  item: { type: String, 
    required: true },

  category: { type: String, required: true, 
    enum: ['stationery', 'uniforms', 'books', 'accessories', 'other']
   },

  quantity: { type: Number,
     required: true,
      default: 0 },

  minThreshold: { type: Number,
     required: true,
      default: 10 }
      ,

  supplier: { type: String,
     required: false 
    },

  unitPrice: { type: Number,
     required: false 
    },

  location: { type: String,
     required: false },
    
  expiryDate: { type: Date, required: false },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
