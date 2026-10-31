const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const Post = require("../models/PostModel");
const { generateToken } = require("../middlewares/auth");
const {
  resetPasswordTokenExpiryMs,
  emailUser,
  Password,
} = require("../config/config");
const logger = require("../utils/logger");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * POST /api/user/register
 * Register a new user and return JWT token.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/login
 * Verify credentials and return JWT token.
 */
const verifyLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/user/profile
 * Return the authenticated user's profile.
 */
const profile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/updateProfile
 * Update the authenticated user's name and/or email.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/user/logout
 * Clear the auth cookie.
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/create-post
 * Create a new blog post. Emits socket event.
 */
const createPost = async (req, res, next) => {
  try {
    const { title, content, imageUrl, tags } = req.body;

    const parsedTags = Array.isArray(tags)
      ? tags
      : tags
      ? tags.split(",").map((t) => t.trim())
      : [];

    const post = await Post.create({
      title,
      content,
      imageUrl: imageUrl || "",
      tags: parsedTags,
    });

    // Emit socket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("new-post", post);
    }

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/forget-password
 * Generate a reset token and send an email with the reset link.
 */
const forgetPasswordVerify = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with that email",
      });
    }

    const resetToken = randomstring.generate();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(
      Date.now() + resetPasswordTokenExpiryMs
    );
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: Password,
      },
    });

    const resetLink = `${FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    const mailOptions = {
      from: emailUser,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    logger.info(`Password reset email sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Reset link sent",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/user/reset-password?token=...
 * Validate the reset token and return the user ID.
 */
const loadResetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    res.status(200).json({
      success: true,
      user_id: user._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/reset-password
 * Reset the user's password using a valid token.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyLogin,
  profile,
  updateProfile,
  logout,
  createPost,
  forgetPasswordVerify,
  loadResetPassword,
  resetPassword,
};
