const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/jwt");

const register = async (req, res) => {
    try {
        const { name, email, password, dateOfBirth } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill in all fields.",
            });
        }
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth);
            if (isNaN(dob.getTime())) {
                return res.status(400).json({ message: "Invalid date of birth format." });
            }
            const today = new Date();
            if (dob > today) {
                return res.status(400).json({ message: "Date of birth cannot be in the future." });
            }
        }
        const normalizedEmail = email.toLowerCase().trim();
        const atIndex = normalizedEmail.indexOf('@');
        if (atIndex > 0) {
            const username = normalizedEmail.substring(0, atIndex);
            if (!/[a-zA-Z]/.test(username)) {
                return res.status(400).json({ message: "Email username must contain at least one letter." });
            }
        }
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists.",
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            dateOfBirth: dateOfBirth || null,
        });

        res.status(201).json({
            message: "Register successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(user._id, user.tokenVersion);

        res.status(200).json({
            message: "Login successfully.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    register,
    login,
};