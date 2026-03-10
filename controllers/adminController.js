const BlogSetting = require("../models/blogSettingModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Post = require("../models/PostModel");

/* secure password */
const securePassword = async (password) => {
  if (!password) {
    throw new Error("Password is required");
  }
  return bcrypt.hash(password, 10);
};

/* blog setup page */
const blogSetup = async (req, res) => {
  const blogConfig = await BlogSetting.findOne({});
  if (blogConfig) {
    return res.redirect("/login");
  }
  res.render("blog-setup");
};

/* save blog + admin user */
const blogSetupSave = async (req, res) => {
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
      is_admin,
    });

    res.redirect("/login");
  } catch (error) {
    console.error("Error saving blog setup:", error);
    res.status(500).send("Error saving blog setup");
  }
};
const getDashboard = async (req, res) => {
  try {
    // No author field exists on the post schema, so don't use populate here.
    const posts = await Post.find({});
    res.render("admin/dashboard", { posts });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
};

module.exports = {
  blogSetup,
  blogSetupSave,
  getDashboard,
};
