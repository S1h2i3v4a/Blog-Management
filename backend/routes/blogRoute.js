const express = require("express");
const { body } = require("express-validator");
const blogController = require("../controllers/blogController");
const { requireAuth } = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();

// GET /api/blog/posts - paginated list of posts
router.get("/posts", blogController.showPosts);

// GET /api/blog/post/:id - single post
router.get("/post/:id", blogController.showSinglePost);

// POST /api/blog/post/:id/comment - add comment
router.post(
  "/post/:id/comment",
  [
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validateRequest,
  blogController.addComment
);

// POST /api/blog/post/:id/reply - reply to a comment
router.post(
  "/post/:id/reply",
  blogController.addReply
);

// PATCH /api/blog/post/:postId/comment/:commentId - update comment
router.patch(
  "/post/:postId/comment/:commentId",
  requireAuth,
  blogController.updateComment
);

// DELETE /api/blog/post/:postId/comment/:commentId - delete comment
router.delete(
  "/post/:postId/comment/:commentId",
  requireAuth,
  blogController.deleteComment
);

module.exports = router;
