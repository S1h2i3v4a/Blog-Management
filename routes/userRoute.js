const express = require("express");
const path = require("path");

const { body } = require("express-validator");
const cookieParser = require("cookie-parser");

const user_route = express();

const session = require("express-session");
const config = require("../config/config");

const {
  attachUser,
  requireAuth,
  requireAdmin,
  requireLogout,
} = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const userController = require("../controllers/userController");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));
user_route.use(cookieParser());

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

user_route.use(express.static(path.join(__dirname, "../public")));
user_route.use(attachUser);

// AUTH ROUTES
user_route.get("/register", requireLogout, userController.loadRegister);
user_route.post(
  "/register",
  requireLogout,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be 6+ chars"),
  ],
  validateRequest,
  userController.register,
);

user_route.get("/login", requireLogout, userController.loadLogin);
user_route.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  userController.verifyLogin,
);

user_route.get("/logout", requireAuth, userController.logout);
user_route.get("/dashboard", requireAdmin, userController.dashboard);
user_route.get("/profile", requireAuth, userController.profile);
user_route.post(
  "/updateProfile",
  requireAuth,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validateRequest,
  userController.updateProfile,
);

user_route.get("/create-post", requireAdmin, userController.loadCreatePost);
user_route.post("/create-post", requireAdmin, userController.createPost);

user_route.get(
  "/forget-password",
  requireLogout,
  userController.loadForgotPassword,
);
user_route.post(
  "/forget-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  validateRequest,
  userController.forgetPasswordVerify,
);
user_route.get(
  "/reset-password",
  requireLogout,
  userController.loadResetPassword,
);
user_route.post(
  "/reset-password",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("confirmPassword")
      .exists()
      .withMessage("Confirm password is required"),
  ],
  validateRequest,
  userController.resetPassword,
);

module.exports = user_route;
