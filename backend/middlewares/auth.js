const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config/config");
const User = require("../models/userModel");

/**
 * Extract token from Authorization header or cookies.
 */
const getTokenFromRequest = (req) => {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  // Fallback to cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

/**
 * Generate a JWT token for the given user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
};

/**
 * Verify a JWT token and return the decoded payload.
 */
const verifyToken = (token) => {
  return jwt.verify(token, jwtSecret);
};

/**
 * Middleware: Attach the current user to req.user if a valid token exists.
 * Does NOT block requests without a token.
 */
const attachUser = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Token invalid or expired — continue without user
    req.user = null;
  }
  next();
};

/**
 * Middleware: Require the request to have a valid authenticated user.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  next();
};

/**
 * Middleware: Require the authenticated user to be an admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  if (req.user.role !== "admin" && !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

/**
 * Middleware factory: Require a specific role.
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Role '${role}' is required`,
      });
    }
    next();
  };
};

/**
 * Middleware: Block already-authenticated users (e.g. from login/register routes).
 */
const requireLogout = (req, res, next) => {
  if (req.user) {
    return res.status(400).json({
      success: false,
      message: "Already logged in",
    });
  }
  next();
};

module.exports = {
  getTokenFromRequest,
  generateToken,
  verifyToken,
  attachUser,
  requireAuth,
  requireAdmin,
  requireRole,
  requireLogout,
};
