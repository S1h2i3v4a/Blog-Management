// CHECK IF USER IS LOGGED IN (ADMIN)
const isLogin = (req, res, next) => {
  try {
    //console.log("Admin is logged in:", req.session.user_id);
    if (req.session.user_id && req.session.is_admin === true) {
      return next(); // ✅ allow access
    } else {
      //console.log("Admin not logged in, redirecting to login");
      return res.redirect("/login"); // ✅ stop here
    }
  } catch (error) {
    console.error("Error verifying login:", error);
    return res.status(500).send("Error verifying login");
  }
};

// CHECK IF USER IS LOGGED OUT
const isLogout = (req, res, next) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/dashboard"); // ✅ stop
    }
    return next(); // ✅ continue
  } catch (error) {
    console.error("Error verifying login:", error);
    return res.status(500).send("Error verifying login");
  }
};

module.exports = {
  isLogin,
  isLogout,
};
