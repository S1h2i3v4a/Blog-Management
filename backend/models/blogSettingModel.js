const mongoose = require("mongoose");

const blogSettingSchema = new mongoose.Schema({
  blog_title: { type: String, required: true },
  blog_logo: { type: String, default: "" },
  description: { type: String, default: "" },
});

module.exports = mongoose.model("BlogSetting", blogSettingSchema);
