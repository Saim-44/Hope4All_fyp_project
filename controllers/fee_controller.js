import Fee from "../model/fee_model.js";

// Add a fee request by/for an orphan
export const createFee = async (req, res) => {
  try {
    const { orphanId, title, amount, dueDate, paymentNumber } = req.body;
    
    if (!orphanId || !title || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newFee = new Fee({
      orphanId,
      title,
      amount,
      dueDate,
      paymentNumber
    });

    await newFee.save();
    res.status(201).json({ success: true, message: "Fee request created successfully", fee: newFee });
  } catch (error) {
    console.error("Create Fee error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get fees specifically for one orphan
export const getOrphanFees = async (req, res) => {
  try {
    const { orphanId } = req.params;
    const fees = await Fee.find({ orphanId }).populate('pledgedBy', 'name email').sort({ dueDate: 1 });
    res.status(200).json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all pending fees for donors to view
export const getAvailableFees = async (req, res) => {
  try {
    const fees = await Fee.find({ status: "pending" })
      .populate('orphanId', 'name location profilePic userId')
      .sort({ dueDate: 1 });
    res.status(200).json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Donor pledges to pay the fee
export const pledgeFee = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({ success: false, message: "Donor ID is required" });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee not found" });
    }

    if (fee.status !== "pending") {
      return res.status(400).json({ success: false, message: "Fee is already pledged or paid" });
    }

    fee.status = "pledged";
    fee.pledgedBy = donorId;
    await fee.save();

    res.status(200).json({ success: true, message: "Fee pledged successfully", fee });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a fee request (only if pending)
export const deleteFee = async (req, res) => {
  try {
    const { feeId } = req.params;
    const fee = await Fee.findById(feeId);
    
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee request not found" });
    }

    if (fee.status !== 'pending') {
      return res.status(400).json({ success: false, message: "Cannot delete a fee that is already pledged or paid" });
    }

    await Fee.findByIdAndDelete(feeId);
    res.status(200).json({ success: true, message: "Fee request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
