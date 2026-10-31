const express = require("express");
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const { attachUser, requireAuth, requireAdmin } = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be 6+ chars"),
  ],
  validateRequest,
  userController.register
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  userController.verifyLogin
);

// Logout
router.get("/logout", requireAuth, userController.logout);

// Profile
router.get("/profile", requireAuth, userController.profile);
router.post("/updateProfile", requireAuth, userController.updateProfile);

// Create Post (Admin only)
router.post("/create-post", requireAdmin, userController.createPost);

// Forgot Password
router.post(
  "/forget-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  validateRequest,
  userController.forgetPasswordVerify
);

// Reset Password
router.get("/reset-password", userController.loadResetPassword);
router.post(
  "/reset-password",
  [
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  userController.resetPassword
);

module.exports = router;
