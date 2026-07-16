const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sendUnauthorized = (res, message = "Not authorized") => {
  return res.status(401).json({
    success: false,
    message,
  });
};

const sendForbidden = (res, message = "Access denied") => {
  return res.status(403).json({
    success: false,
    message,
  });
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};

// Protect route
const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return sendUnauthorized(res, "No token provided. Please login again.");
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is missing in environment variables",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return sendUnauthorized(res, "Invalid token payload");
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return sendUnauthorized(res, "User not found. Please login again.");
    }

    if (user.isActive === false) {
      return sendForbidden(res, "Your account is inactive");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "TokenExpiredError") {
      return sendUnauthorized(res, "Token expired. Please login again.");
    }

    if (error.name === "JsonWebTokenError") {
      return sendUnauthorized(res, "Invalid token. Please login again.");
    }

    return sendUnauthorized(res, "Authentication failed");
  }
};

// Role authorization
const authorize = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, "User not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(
        res,
        `Role '${req.user.role}' is not allowed to access this route`
      );
    }

    next();
  };
};

// Useful aliases so old route files do not break
const adminOnly = authorize("admin");
const admin = authorize("admin");
const authorizeRoles = authorize;
const restrictTo = authorize;

module.exports = {
  protect,
  authorize,
  authorizeRoles,
  restrictTo,
  adminOnly,
  admin,
};