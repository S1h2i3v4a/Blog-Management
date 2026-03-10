const logger = require("../utils/logger");

// CHECK IF USER IS LOGGED IN (ADMIN)
const isLogin = (req, res, next) => {
  try {
    if (req.session?.user_id && req.session?.is_admin === true) {
      return next();
    }
    return res.redirect("/login");
  } catch (error) {
    logger.error("Error verifying login", { error });
    return res.status(500).send("Error verifying login");
  }
};

// CHECK IF USER IS LOGGED OUT
const isLogout = (req, res, next) => {
  try {
    if (req.session?.user_id) {
      return res.redirect("/dashboard");
    }
    return next();
  } catch (error) {
    logger.error("Error verifying login", { error });
    return res.status(500).send("Error verifying login");
  }
};

module.exports = {
  isLogin,
  isLogout,
};
