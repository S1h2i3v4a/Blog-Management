const BlogSetting = require("../models/blogSettingModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Post = require("../models/PostModel");
const logger = require("../utils/logger");

/* secure password */
const securePassword = async (password) => {
  if (!password) {
    throw new Error("Password is required");
  }
  return bcrypt.hash(password, 10);
};

/* blog setup page */
const blogSetup = async (req, res, next) => {
  try {
    const blogConfig = await BlogSetting.findOne({});
    if (blogConfig) {
      return res.redirect("/login");
    }
    res.render("blog-setup");
  } catch (error) {
    next(error);
  }
};

/* save blog + admin user */
const blogSetupSave = async (req, res, next) => {
  try {
    const { blog_title, description, name, email, password, is_admin } =
      req.body;

    if (!password) {
      return res.render("blog-setup", {
        message: "Password is required",
      });
    }

    const blog_logo = req.file ? req.file.filename : null;
    const hashedPassword = await securePassword(password);

    // create blog settings
    await BlogSetting.create({
      blog_title,
      blog_logo,
      description,
    });

    // create admin user
    await User.create({
      name,
      email,
      password: hashedPassword,
      is_admin: is_admin === "true" || is_admin === true,
    });

    res.redirect("/login");
  } catch (error) {
    logger.error("Error saving blog setup", { error });
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const posts = await Post.find({});
    res.render("admin/dashboard", { posts });
  } catch (error) {
    next(error);
  }
};

const loadEditPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      return next(err);
    }
    res.render("admin/editPost", { post });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { title, content, tags, imageUrl } = req.body;

    const updateData = {
      title,
      content,
      imageUrl,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    };

    const updated = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
    });

    if (!updated) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      return next(err);
    }

    return res.json({ success: true, post: updated });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    await Post.findByIdAndDelete(postId);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  blogSetup,
  blogSetupSave,
  getDashboard,
  loadEditPost,
  updatePost,
  deletePost,
};
