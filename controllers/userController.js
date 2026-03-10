const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const randomstring = require("randomstring");

const User = require("../models/userModel");
const Post = require("../models/PostModel");
const config = require("../config/config");
const logger = require("../utils/logger");
const { generateToken } = require("../middlewares/auth");

const loadLogin = async (req, res, next) => {
  try {
    res.render("login");
  } catch (error) {
    next(error);
  }
};

const loadRegister = async (req, res, next) => {
  try {
    res.render("register");
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error("Email is already registered");
      err.statusCode = 409;
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const hasAnyUser = await User.exists({});
    const role = hasAnyUser ? "user" : "admin";

    const created = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      is_admin: role === "admin",
    });

    const token = generateToken(created);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    });

    res.redirect(role === "admin" ? "/dashboard" : "/profile");
  } catch (error) {
    next(error);
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userData) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      return next(err);
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      return next(err);
    }

    const token = generateToken(userData);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    });

    // Keep session for legacy templates
    req.session = req.session || {};
    req.session.user_id = userData._id;
    req.session.is_admin = userData.role === "admin";

    if (userData.role === "admin") {
      return res.redirect("/dashboard");
    }

    return res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    logger.info("Admin dashboard accessed", { user: req.user?.email });
    res.render("admin/dashboard", {
      message: req.query.message || null,
    });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.session?.user_id;
    const user = await User.findById(userId);

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("profile", { user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.user?._id || req.session?.user_id;
    const userData = await User.findById(userId);

    if (!userData) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    userData.name = name;
    userData.email = email;
    await userData.save();

    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("token");
    if (req.session) {
      req.session.destroy(() => {});
    }
    res.redirect("/login");
  } catch (error) {
    next(error);
  }
};

const loadCreatePost = async (req, res, next) => {
  try {
    res.render("admin/create-post");
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, content, tags, imageUrl } = req.body;

    let finalImage = "";
    if (req.file) {
      finalImage = "/images/" + req.file.filename;
    } else if (imageUrl && imageUrl.trim() !== "") {
      finalImage = imageUrl.trim();
    }

    const tagsArray = tags ? tags.split(",").map((t) => t.trim()) : [];

    const newPost = await Post.create({
      title,
      content,
      imageUrl: finalImage,
      tags: tagsArray,
    });

    const io = req.app.get("io");
    io.emit("new-post", {
      postId: newPost._id,
      title: newPost.title,
      content: newPost.content,
      imageUrl: newPost.imageUrl,
      createdAt: newPost.createdAt,
    });

    res.render("admin/dashboard", { message: "Post Created Successfully" });
  } catch (error) {
    next(error);
  }
};

const loadForgotPassword = async (req, res, next) => {
  try {
    res.render("forgot-password");
  } catch (error) {
    next(error);
  }
};

const forgetPasswordVerify = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userData) {
      return res.render("forgot-password", { message: "Email not found" });
    }

    const randomString = randomstring.generate();
    const expires = new Date(Date.now() + config.resetPasswordTokenExpiryMs);

    userData.resetPasswordToken = randomString;
    userData.resetPasswordExpires = expires;
    await userData.save();

    const transporter = require("nodemailer").createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.Password,
      },
    });

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "Reset Password",
      html: `<p>Click <a href="http://localhost:3000/reset-password?token=${randomString}">here</a> to reset your password. The link expires in 1 hour.</p>`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        logger.error("Error sending password reset email", { error });
        return res.render("forgot-password", {
          message: "Error sending reset link",
        });
      }
      res.render("forgot-password", {
        message: "Reset link sent to your email",
      });
    });
  } catch (error) {
    next(error);
  }
};

const loadResetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;
    const userData = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!userData) {
      return res.render("reset-password", {
        message: "Invalid or expired token",
      });
    }

    res.render("reset-password", { user_id: userData._id });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { user_id, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("reset-password", {
        message: "Passwords do not match",
      });
    }

    const userData = await User.findOne({
      _id: user_id,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!userData) {
      return res.render("reset-password", {
        message: "Invalid or expired token",
      });
    }

    userData.password = await bcrypt.hash(password, 10);
    userData.resetPasswordToken = "";
    userData.resetPasswordExpires = null;
    await userData.save();

    res.render("login", { message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadLogin,
  loadRegister,
  register,
  verifyLogin,
  dashboard,
  profile,
  updateProfile,
  logout,
  loadCreatePost,
  createPost,
  loadForgotPassword,
  forgetPasswordVerify,
  loadResetPassword,
  resetPassword,
};
