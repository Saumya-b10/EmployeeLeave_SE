const rateLimit = require("express-rate-limit");

const isProduction = process.env.NODE_ENV === "production";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: isProduction ? 30 : 200, // relaxed limit to avoid developer lockout
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
    },
});

module.exports = { authLimiter };