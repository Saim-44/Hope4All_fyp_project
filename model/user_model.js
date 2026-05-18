import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["donor", "volunteer", "orphanage", "orphan", "admin"],
    default: "donor",
  },
  status: {
    type: String,
    enum: ["pending", "verified", "suspended"],
    default: "pending",
  },
  suspensionReason: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: true },
  verificationOTP: { type: String },
  verificationOTPExpiry: { type: Date },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

export default User;
