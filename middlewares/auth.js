const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../config/config");
const logger = require("../utils/logger");

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const attachUser = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("_id name email role");
    if (!user) {
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn("Failed to attach user from token", { error });
    return next();
  }
};

const respondAuthError = (req, res, statusCode, message) => {
  if (req.accepts(["html", "text"])) {
    return res.status(statusCode).redirect("/login");
  }
  return res.status(statusCode).json({ success: false, message });
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return respondAuthError(req, res, 401, "Authentication required");
  }
  next();
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return respondAuthError(req, res, 401, "Authentication required");
  }

  if (req.user.role !== role) {
    return respondAuthError(req, res, 403, "Forbidden");
  }

  next();
};

const requireAdmin = requireRole("admin");

const requireLogout = (req, res, next) => {
  if (req.user) {
    // Already logged in – redirect to dashboard or profile
    return res.redirect(req.user.role === "admin" ? "/dashboard" : "/profile");
  }
  next();
};

module.exports = {
  getTokenFromRequest,
  generateToken,
  attachUser,
  requireAuth,
  requireAdmin,
  requireRole,
  requireLogout,
};
