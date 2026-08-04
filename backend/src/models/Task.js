const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        priority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium",
        },

        dueDate: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ["todo", "in-progress", "completed"],
            default: "todo",
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Task", taskSchema);
