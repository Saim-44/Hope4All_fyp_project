import multer from "multer";
import pkg from "multer-storage-cloudinary";
const CloudinaryStorage = pkg;
import cloudinary from "../Files/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "orphan_documents",
    resource_type: "auto",
    allowedFormats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const upload = multer({ storage });

export default upload;
