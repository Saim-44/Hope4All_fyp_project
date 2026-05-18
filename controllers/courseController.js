import Course from "../model/course_model.js";
import User from "../model/user_model.js";

export const addCourse = async (req, res) => {
  try {
    const { title, description, link, category, instructorId } = req.body;

    const user = await User.findById(instructorId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Admins are auto-approved, donors are pending
    const status = user.role === 'admin' ? 'approved' : 'pending';

    const newCourse = new Course({
      title,
      description,
      link,
      category,
      instructor: instructorId,
      instructorName: user.username,
      status
    });

    await newCourse.save();
    res.status(201).json({ success: true, course: newCourse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getApprovedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPendingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const course = await Course.findByIdAndUpdate(id, { status }, { new: true });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDonorCourses = async (req, res) => {
  try {
    const { donorId } = req.params;
    const courses = await Course.find({ instructor: donorId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
