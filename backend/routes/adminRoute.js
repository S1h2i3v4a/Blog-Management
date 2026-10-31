const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Ensure public/images directory exists
const uploadDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});
const upload = multer({ storage: storage });

// Blog Setup
router.get("/blogSetup", adminController.blogSetup);
router.post("/blogSetup", upload.single("blog_logo"), adminController.blogSetupSave);

// Upload post image (Admin only)
router.post(
  "/upload-post-image",
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
    res.json({
      success: true,
      imageUrl: "/images/" + req.file.filename,
    });
  }
);

// Admin Dashboard & Post Management
router.get("/dashboard", requireAdmin, adminController.getDashboard);
router.get("/edit-post/:id", requireAdmin, adminController.loadEditPost);
router.patch("/update-post/:id", requireAdmin, adminController.updatePost);
router.delete("/delete-post/:id", requireAdmin, adminController.deletePost);

module.exports = router;
