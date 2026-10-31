const BlogSetting = require("../models/blogSettingModel");

module.exports = async (req, res, next) => {
  try {
    const blogConfig = await BlogSetting.findOne();
    if (!blogConfig && !req.path.includes("/blogSetup")) {
      return res.status(403).json({
        success: false,
        message: "Blog not set up yet",
        needsSetup: true,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
