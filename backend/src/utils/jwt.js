const jwt = require("jsonwebtoken");

const generateToken = (userId, tokenVersion) => {
    return jwt.sign(
        { id: userId, tokenVersion: tokenVersion || 0 },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};

module.exports = generateToken;