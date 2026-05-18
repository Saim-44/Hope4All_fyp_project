import Task from '../model/task_model.js';
import User from '../model/user_model.js';
import Notification from '../model/notification_model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createTask = asyncHandler(async (req, res, next) => {
    const { volunteerId, title, description, type, school, orphanageId, date, priority, notes, assignedBy } = req.body;

    if (volunteerId === 'all') {
      const volunteers = await User.find({ role: 'volunteer' });
      const tasks = volunteers.map(v => ({
        volunteerId: v._id,
        title,
        description,
        type: type || 'other',
        school: school || 'N/A',
        orphanageId,
        date: date || new Date(),
        priority: priority || 'medium',
        assignedBy: assignedBy || v._id,
        notes,
      }));

      await Task.insertMany(tasks);

      // Create notifications
      const notifications = volunteers.map(v => ({
        userId: v._id,
        type: 'task',
        title: 'New Broadcast Mission',
        message: `A new team mission "${title}" has been assigned.`,
      }));
      await Notification.insertMany(notifications);

      return res.status(201).json({ message: 'Task assigned to all volunteers' });
    }

    const newTask = new Task({
      volunteerId,
      title,
      description,
      type: type || 'other',
      school: school || 'N/A',
      orphanageId,
      date: date || new Date(),
      priority: priority || 'medium',
      assignedBy: assignedBy || volunteerId,
      notes,
    });

    await newTask.save();

    // Create notification for volunteer
    const notification = new Notification({
      userId: volunteerId,
      type: 'task',
      title: 'New Task Assigned',
      message: `New task "${title}" has been assigned to you`,
    });

    await notification.save();

    res.status(201).json({ message: 'Task created successfully', task: newTask });
});

export const getTasksByVolunteer = asyncHandler(async (req, res, next) => {
    const tasks = await Task.find({ volunteerId: req.params.volunteerId })
      .populate('orphanageId', 'name')
      .sort({ date: 1 });

    res.status(200).json({ tasks });
});

export const getAllTasks = asyncHandler(async (req, res, next) => {
    const { status, type } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const tasks = await Task.find(filter)
      .populate('volunteerId', 'username email')
      .populate('orphanageId', 'name')
      .sort({ date: 1 });

    res.status(200).json({ tasks });
});

export const updateTaskStatus = asyncHandler(async (req, res, next) => {
    const { status, notes } = req.body;
    let updateData = { status, notes, updatedAt: Date.now() };

    if (req.file) {
      updateData.proofImage = req.file.path || req.file.url || req.file.secure_url;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      updateData,
      { new: true }
    ).populate('volunteerId', 'username');

    if (!updatedTask) {
      return next(new AppError('Task not found', 404));
    }

    // Create notification
    const notification = new Notification({
      type: 'task_update',
      title: `Task ${status}`,
      message: `Task "${updatedTask.title}" status updated to ${status}`,
    });

    await notification.save();

    res.status(200).json({ message: 'Task status updated', task: updatedTask });
});

export const getVolunteerStats = asyncHandler(async (req, res, next) => {
    const volunteerId = req.params.volunteerId;

    const totalTasks = await Task.countDocuments({ volunteerId });
    const completedTasks = await Task.countDocuments({ volunteerId, status: 'completed' });
    const activeTasks = await Task.countDocuments({
      volunteerId,
      status: { $in: ['assigned', 'in_progress'] }
    });

    const recentTasks = await Task.find({ volunteerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt');

    res.status(200).json({
      stats: {
        totalTasks,
        completedTasks,
        activeTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
      },
      recentTasks
    });
});
