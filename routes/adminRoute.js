const express = require("express");
const path = require("path");
const multer = require("multer");

const admin_route = express();

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

const session = require("express-session");
const config = require("../config/config");

admin_route.use(
  session({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);
admin_route.set("view engine", "ejs");
admin_route.set("views", path.join(__dirname, "../views"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const adminController = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminLoginAuth");

admin_route.get("/blogSetup", adminController.blogSetup);
admin_route.post(
  "/blogSetup",
  upload.single("blog_logo"),
  adminController.blogSetupSave,
);
const userController = require("../controllers/userController");

admin_route.post(
  "/upload-post-image",

  adminAuth.isLogin,
  upload.single("image"),
  (req, res) => {
    res.json({
      success: true,
      imageUrl: "/images/" + req.file.filename,
    });
  },
);
admin_route.post(
  "/create-post",
  adminAuth.isLogin,
  upload.none(), // 🔥 THIS FIXES req.body
  userController.createPost,
);

module.exports = admin_route;
