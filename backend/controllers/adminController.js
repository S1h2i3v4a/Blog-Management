const bcrypt = require("bcrypt");
const BlogSetting = require("../models/blogSettingModel");
const User = require("../models/userModel");
const Post = require("../models/PostModel");
const logger = require("../utils/logger");

/**
 * GET /api/admin/blogSetup
 * Check if a blog has already been set up.
 */
const blogSetup = async (req, res, next) => {
  try {
    const blog = await BlogSetting.findOne();
    res.status(200).json({
      success: true,
      exists: !!blog,
      blog: blog || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/blogSetup
 * Create the blog settings and the initial admin user.
 * Expects multipart/form-data with optional logo file.
 */
const blogSetupSave = async (req, res, next) => {
  try {
    const existingBlog = await BlogSetting.findOne();
    if (existingBlog) {
      return res.status(400).json({
        success: false,
        message: "Blog has already been set up",
      });
    }

    const blog_title = req.body.blog_title;
    const description = req.body.description;
    const admin_name = req.body.admin_name || req.body.name;
    const admin_email = req.body.admin_email || req.body.email;
    const admin_password = req.body.admin_password || req.body.password;

    if (!admin_password) {
      return res.status(400).json({
        success: false,
        message: "Admin password is required",
      });
    }

    let blog_logo = "";
    if (req.file) {
      blog_logo = "/images/" + req.file.filename;
    }

    await BlogSetting.create({
      blog_title,
      blog_logo,
      description: description || "",
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    await User.create({
      name: admin_name,
      email: admin_email,
      password: hashedPassword,
      is_admin: true,
      role: "admin",
    });

    logger.info(`Blog "${blog_title}" set up by admin ${admin_email}`);

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard
 * Return all posts for the admin dashboard.
 */
const getDashboard = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/edit-post/:id
 * Return a single post for editing.
 */
const loadEditPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/update-post/:id
 * Update a post's title, content, imageUrl, or tags.
 */
const updatePost = async (req, res, next) => {
  try {
    const { title, content, imageUrl, tags } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (tags !== undefined) updates.tags = tags;

    const post = await Post.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/delete-post/:id
 * Delete a post.
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    res.status(200).json({
      success: true,
    });
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
