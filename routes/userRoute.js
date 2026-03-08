const express = require("express");
const path = require("path");

const user_route = express(); // ✅ FIXED

const session = require("express-session");
const config = require("../config/config");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.use(
  session({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

user_route.set("view engine", "ejs");
user_route.set("views", path.join(__dirname, "../views"));

const userController = require("../controllers/userController");

user_route.use(express.static(path.join(__dirname, "../public")));
const adminAuth = require("../middlewares/adminLoginAuth");

// ROUTES
user_route.get("/login", adminAuth.isLogout, userController.loadLogin);
user_route.post("/login", userController.verifyLogin);
//console.log("User route loaded");
user_route.get("/logout", adminAuth.isLogin, userController.logout);
user_route.get("/dashboard", adminAuth.isLogin, userController.dashboard);
user_route.get("/profile", userController.profile);
user_route.post("/updateProfile", userController.updateProfile);
user_route.get(
  "/create-post",
  adminAuth.isLogin,
  userController.loadCreatePost,
);
user_route.post("/create-post", adminAuth.isLogin, userController.createPost);
user_route.get(
  "/forget-password",
  adminAuth.isLogout,
  userController.loadForgotPassword,
);
user_route.post("/forget-password", userController.forgetPasswordVerify);
user_route.get(
  "/reset-password",
  adminAuth.isLogout,
  userController.loadResetPassword,
);
user_route.post("/reset-password", userController.resetPassword);

module.exports = user_route;
