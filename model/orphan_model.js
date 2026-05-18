import mongoose from "mongoose";

const orphanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  location: { type: String, required: true },
  profilePic: { type: String, required: true },
  supportingDocs: { type: String, required: true },
  phone: { type: String, required: false },
  school: { type: String, required: false },
  classLevel: { type: String, required: false },
  bio: { type: String, required: false },
  cnicOrBForm: { type: String },
  orphanageId: { type: mongoose.Schema.Types.ObjectId, ref: "OrphanAge", required: false },
  bFormDoc: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Orphan = mongoose.model("Orphan", orphanSchema);

export default Orphan;
