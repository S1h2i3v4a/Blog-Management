const express = require("express");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");

const admin_route = express();

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));
admin_route.use(cookieParser());

const session = require("express-session");
const config = require("../config/config");

const { attachUser, requireAdmin } = require("../middlewares/auth");

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
const userController = require("../controllers/userController");

admin_route.use(express.static(path.join(__dirname, "../public")));
admin_route.use(attachUser);

admin_route.get("/blogSetup", adminController.blogSetup);
admin_route.post(
  "/blogSetup",
  upload.single("blog_logo"),
  adminController.blogSetupSave,
);

admin_route.post(
  "/upload-post-image",
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    res.json({
      success: true,
      imageUrl: "/images/" + req.file.filename,
    });
  },
);

admin_route.post("/create-post", requireAdmin, userController.createPost);
admin_route.get("/dashboard", requireAdmin, adminController.getDashboard);
admin_route.get("/edit-post/:id", requireAdmin, adminController.loadEditPost);
admin_route.patch("/update-post/:id", requireAdmin, adminController.updatePost);
admin_route.delete(
  "/delete-post/:id",
  requireAdmin,
  adminController.deletePost,
);

module.exports = admin_route;
