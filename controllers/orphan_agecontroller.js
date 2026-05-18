import OrphanAge from "../model/orphan_age.js";
import User from "../model/user_model.js";
import { convertPdfToImageUrl } from "../utils/fileUtils.js";

export const createOrphanAge = async (req, res) => {
  try {
    // Filter files by fieldname
    const registrationCertFile = req.files ? req.files.find(file => file.fieldname === "registrationCert") : null;
    const buildingImagesFiles = req.files ? req.files.filter(file => file.fieldname === "buildingImages") : [];

    const registrationCert = convertPdfToImageUrl(registrationCertFile 
      ? (registrationCertFile.path || registrationCertFile.url || registrationCertFile.secure_url) 
      : null);
    const buildingImages = buildingImagesFiles.map(file => 
      (file.path || file.url || file.secure_url)
    );

    const b = req.body;
    const userId = b.userId;
    const name = b.name;
    const registrationNumber = b.registrationNumber;
    const establishedYear = b.establishedYear;
    const managerName = b.managerName;
    const staffCount = b.staffCount;

    // Support both nested object (b.location.address) and flat keys (b['location[address]'])
    const address = (b.location && b.location.address) || b['location[address]'];
    const city = (b.location && b.location.city) || b['location[city]'];
    const state = (b.location && b.location.state) || b['location[state]'];
    const zipCode = (b.location && b.location.zipCode) || b['location[zipCode]'];

    const phone = (b.contactInfo && b.contactInfo.phone) || b['contactInfo[phone]'];
    const email = (b.contactInfo && b.contactInfo.email) || b['contactInfo[email]'];

    const currentCapacity = (b.capacity && b.capacity.current) || b['capacity[current]'] || 0;
    const maxCapacity = (b.capacity && b.capacity.max) || b['capacity[max]'] || 0;
    
    const newOrphanage = new OrphanAge({
      userId,
      name,
      registrationNumber,
      establishedYear,
      managerName,
      staffCount,
      location: { address, city, state, zipCode },
      contactInfo: { phone, email },
      capacity: { 
        current: parseInt(currentCapacity) || 0, 
        max: parseInt(maxCapacity) || 0 
      },
      documents: {
        registrationCert,
        buildingImages,
      },
    });

    await newOrphanage.save();

    // Update User status to pending for admin approval
    await User.findByIdAndUpdate(userId, { status: 'pending' });

    res.status(201).json({
      success: true,
      message: "Orphanage created successfully!",
      data: newOrphanage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

export const getOrphanages = async (req, res) => {
  try {
    const orphanages = await OrphanAge.find().sort({ createdAt: -1 });
    const formatted = orphanages.map(o => ({
      ...o.toObject(),
      profilePic: o.documents?.buildingImages?.[0] || null
    }));
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrphanageProfile = async (req, res) => {
  try {
    const orphanage = await OrphanAge.findOne({ userId: req.params.userId });
    if (!orphanage) return res.status(404).json({ message: 'Orphanage not found' });
    res.status(200).json({ orphanage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
