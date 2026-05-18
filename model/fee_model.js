import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  orphanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Orphan",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paymentNumber: {
    type: String,
    required: false, // Optional but useful for EasyPaisa/JazzCash
  },
  status: {
    type: String,
    enum: ["pending", "pledged", "paid"],
    default: "pending",
  },
  pledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donor",
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Fee = mongoose.model("Fee", feeSchema);

export default Fee;
