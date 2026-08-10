const bcrypt = require("bcryptjs");
const User = require("../models/User");

const getProfile = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, dateOfBirth } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (name !== undefined) user.name = name;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
        await user.save();
        res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                dateOfBirth: user.dateOfBirth,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Please fill in all password fields." });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters." });
        }
        const user = await User.findById(req.user.id).select("+password");
        if (!user) return res.status(404).json({ message: "User not found." });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password." });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Task = require("../models/Task");

const getUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 5, sortBy, sortOrder } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            };
        }
        const total = await User.countDocuments(query);
        let users = await User.find(query).select("-password");

        // For taskCount sorting, we need counts for ALL users before paginating
        let usersWithTaskCount;
        if (sortBy === "taskCount") {
            usersWithTaskCount = await Promise.all(
                users.map(async (u) => {
                    const taskCount = await Task.countDocuments({ user: u._id });
                    return { ...u.toObject(), taskCount };
                })
            );
        }

        // Helper: admin = 0, user = 1
        const roleWeight = (u) => (u.role === "admin" ? 0 : 1);

        if (sortBy === "name") {
            // Sort purely by name — admin/user mixed equally
            users.sort((a, b) => {
                const nameA = a.name ? a.name.trim() : "";
                const nameB = b.name ? b.name.trim() : "";
                const partsA = nameA.split(/\s+/);
                const partsB = nameB.split(/\s+/);
                const lastNameA = partsA[partsA.length - 1] || "";
                const lastNameB = partsB[partsB.length - 1] || "";
                let cmp = lastNameA.localeCompare(lastNameB, "vi", { sensitivity: "base" });
                if (cmp === 0) {
                    const precedingA = partsA.slice(0, -1).join(" ");
                    const precedingB = partsB.slice(0, -1).join(" ");
                    cmp = precedingA.localeCompare(precedingB, "vi", { sensitivity: "base" });
                }
                return sortOrder === "desc" ? -cmp : cmp;
            });
        } else if (sortBy === "email") {
            // Sort purely by email — admin/user mixed equally
            users.sort((a, b) => {
                const emailA = (a.email || "").toLowerCase();
                const emailB = (b.email || "").toLowerCase();
                const cmp = emailA.localeCompare(emailB, "en", { sensitivity: "base" });
                return sortOrder === "desc" ? -cmp : cmp;
            });
        } else if (sortBy === "dateOfBirth") {
            // Sort purely by dateOfBirth — admin/user mixed equally
            users.sort((a, b) => {
                const dateA = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
                const dateB = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
                // asc = youngest first (newest date = largest timestamp)
                // desc = oldest first (oldest date = smallest timestamp)
                return sortOrder === "desc" ? dateA - dateB : dateB - dateA;
            });
        } else if (sortBy === "taskCount" && usersWithTaskCount) {
            // Sort purely by taskCount — admin/user mixed equally
            usersWithTaskCount.sort((a, b) => {
                const cmp = a.taskCount - b.taskCount;
                return sortOrder === "desc" ? -cmp : cmp;
            });
        } else if (sortBy === "role") {
            // asc = admin first, desc = user first; tie-break by createdAt
            users.sort((a, b) => {
                const roleCmp = roleWeight(a) - roleWeight(b);
                if (roleCmp !== 0) return sortOrder === "desc" ? -roleCmp : roleCmp;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } else {
            // Default (no sort): admin first, then newest first
            users.sort((a, b) => {
                const roleCmp = roleWeight(a) - roleWeight(b);
                if (roleCmp !== 0) return roleCmp;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        const startIndex = (Number(page) - 1) * Number(limit);

        let dataWithTasks;
        if (sortBy === "taskCount" && usersWithTaskCount) {
            dataWithTasks = usersWithTaskCount.slice(startIndex, startIndex + Number(limit));
        } else {
            const paginatedUsers = users.slice(startIndex, startIndex + Number(limit));
            dataWithTasks = await Promise.all(
                paginatedUsers.map(async (u) => {
                    const taskCount = await Task.countDocuments({ user: u._id });
                    return { ...u.toObject(), taskCount };
                })
            );
        }

        res.status(200).json({
            success: true,
            data: dataWithTasks,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)) || 1,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: "User not found." });
        if (targetUser.role === "admin" && role !== "admin") {
            return res.status(400).json({ message: "Cannot demote another Admin's role." });
        }
        targetUser.role = role;
        await targetUser.save();
        res.status(200).json({
            message: "Role updated successfully.",
            user: targetUser,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: "User not found." });
        if (targetUser.role === "admin") {
            return res.status(400).json({ message: "Cannot delete an Admin account." });
        }
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getUsers,
    updateUserRole,
    deleteUser,
};