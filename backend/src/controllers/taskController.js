const Task = require("../models/Task");

// Get all tasks for a user
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: tasks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get a single task
const getTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        res.json({
            success: true,
            data: task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Create a new task
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, status } = req.body;
        
        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            status: status || 'todo',
            completedAt: status === 'completed' ? new Date() : null,
            user: req.user.id,
        });
        res.status(201).json({
            success: true,
            data: task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update a task
const updateTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, status } = req.body;
        const updateData = { title, description, priority, dueDate, status };
        if (status !== undefined) {
            updateData.completedAt = status === "completed" ? new Date() : null;
        }
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updateData,
            { new: true, runValidators: true }
        );
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        res.json({
            success: true,
            data: task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete a task
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        res.json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
};
