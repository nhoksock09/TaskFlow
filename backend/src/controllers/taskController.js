const Task = require("../models/Task");

const getTasks = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // 1. Permanently delete all tasks older than 6 months based on dueDate
        await Task.deleteMany({
            user: req.user.id,
            dueDate: { $ne: null, $lt: sixMonthsAgo },
        });

        // 2. Fetch all tasks within rolling 6-month window (dueDate >= now - 6 months or dueDate is null) and isDeleted !== true
        const tasks = await Task.find({
            user: req.user.id,
            isDeleted: { $ne: true },
            $or: [
                { dueDate: null },
                { dueDate: { $gte: sixMonthsAgo } }
            ]
        }).sort({ createdAt: -1 });

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

const getTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user.id, isDeleted: { $ne: true } });
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

const updateTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, status } = req.body;
        const updateData = { title, description, priority, dueDate, status };
        if (status !== undefined) {
            updateData.completedAt = status === "completed" ? new Date() : null;
        }
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id, isDeleted: { $ne: true } },
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

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id, isDeleted: { $ne: true } });

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
