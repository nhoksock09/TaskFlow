const express = require("express");

const router = express.Router();

const { protect, admin } = require("../middleware/authMiddleware");

const {
    getProfile,
    updateProfile,
    changePassword,
    getUsers,
    updateUserRole,
    deleteUser,
} = require("../controllers/userController");

// User profile routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Admin user management routes
router.get("/", protect, admin, getUsers);
router.put("/:id/role", protect, admin, updateUserRole);
router.delete("/:id", protect, admin, deleteUser);

module.exports = router;