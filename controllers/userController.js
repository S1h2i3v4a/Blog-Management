const user = require("../models/userModel");
const BlogSetting = require("../models/blogSettingModel");
const bcrypt = require("bcrypt");
const Post = require("../models/PostModel");
const nodeMailer = require("nodemailer");
const randomstring = require("randomstring");
const config = require("../config/config");

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.error("Error loading login page:", error);
    res.status(500).send("Error loading login page");
  }
};
const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await user.findOne({ email: email });
    if (!userData) {
      return res.render("login", { message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.render("login", { message: "Invalid email or password" });
    }

    // Password matches, set session
    req.session.user_id = userData._id;
    req.session.is_admin = Boolean(userData.is_admin);

    // Redirect based on role
    if (userData.is_admin === false) {
      return res.redirect("/profile");
    } else {
      return res.redirect("/dashboard");
    }
  } catch (error) {
    console.error("Error verifying login:", error);
    res.status(500).send("Error verifying login");
  }
};

const dashboard = async (req, res) => {
  try {
    console.log("Admin dashboard accessed");
    res.render("admin/dashboard", {
      message: req.query.message || null,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
};
const profile = async (req, res) => {
  try {
    res.render("profile");
  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).send("Error loading profile");
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.session.user_id;
    const userData = await user.findById(userId);

    if (!userData) {
      return res.status(404).send("User not found");
    }

    const updateData = { name, email };

    await user.findByIdAndUpdate(userId, updateData);

    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Error updating profile");
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).send("Error during logout");
  }
};
const loadCreatePost = async (req, res) => {
  try {
    res.render("admin/create-post");
  } catch (error) {
    console.error("Error loading create post page:", error);
    res.status(500).send("Error loading create post page");
  }
};
const createPost = async (req, res) => {
  const { title, content, tags, imageUrl } = req.body;

  try {
    let finalImage = "";

    // ✅ Priority: local file > URL
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
    console.error("Error creating post:", error);
    res.status(500).send("Error creating post");
  }
};
const loadForgotPassword = async (req, res) => {
  try {
    res.render("forgot-password");
  } catch (error) {
    console.error("Error loading forgot password page:", error);
    res.status(500).send("Error loading forgot password page");
  }
};

const forgetPasswordVerify = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await user.findOne({ email: email });
    if (!userData) {
      return res.render("forgot-password", { message: "Email not found" });
    }
    const randomString = randomstring.generate();
    await user.updateOne({ email: email }, { $set: { token: randomString } });
    const transporter = nodeMailer.createTransport({
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
      html: `<p>Click <a href="http://localhost:3000/reset-password?token=${randomString}">here</a> to reset your password.</p>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.render("forgot-password", {
          message: "Error sending reset link",
        });
      }
      res.render("forgot-password", {
        message: "Reset link sent to your email",
      });
    });
  } catch (error) {
    console.error("Error verifying forgot password:", error);
    res.status(500).send("Error verifying forgot password");
  }
};

const loadResetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const userData = await user.findOne({ token: token });
    if (!userData) {
      return res.render("reset-password", { message: "Invalid token" });
    }
    res.render("reset-password", { user_id: userData._id });
  } catch (error) {
    console.error("Error loading reset password page:", error);
    res.status(500).send("Error loading reset password page");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { user_id, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("reset-password", {
        message: "Passwords do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.findByIdAndUpdate(user_id, {
      password: hashedPassword,
      token: "",
    });

    res.render("login", { message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Error resetting password");
  }
};

module.exports = {
  loadLogin,
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
