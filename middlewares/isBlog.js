const BlogSetting = require("../models/blogSettingModel");
const logger = require("../utils/logger");

const isBlog = async (req, res, next) => {
  try {
    const blogConfig = await BlogSetting.findOne();

    // Allow blog setup page always
    if (!blogConfig && !req.path.startsWith("/blogSetup")) {
      return res.redirect("/admin/blogSetup");
    }

    next();
  } catch (error) {
    logger.error("Error checking blog settings", { error });
    return next(error);
  }
};

module.exports = isBlog;
