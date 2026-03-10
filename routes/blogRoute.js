const express = require("express");
const { body } = require("express-validator");

const blogController = require("../controllers/blogController");
const { attachUser, requireAuth } = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");

const blog_route = express();

blog_route.set("view engine", "ejs");
blog_route.set("views", "./views");
blog_route.use(express.static("public"));
blog_route.use(attachUser);

blog_route.get("/", blogController.showPosts);
blog_route.get("/post/:id", blogController.showSinglePost);

// Comment creation is public, but we validate payload
blog_route.post(
  "/post/:id",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  validateRequest,
  blogController.addComment,
);

// Replies
blog_route.post(
  "/do-reply",
  [
    body("postId").notEmpty().withMessage("Post ID required"),
    body("commentId").notEmpty().withMessage("Comment ID required"),
    body("reply").trim().notEmpty().withMessage("Reply text is required"),
  ],
  validateRequest,
  blogController.addReply,
);

// Comment updates/deletes require authentication to help prevent abuse.
blog_route.patch(
  "/post/:postId/comment/:commentId",
  requireAuth,
  [body("comment").trim().notEmpty().withMessage("Comment text is required")],
  validateRequest,
  blogController.updateComment,
);

blog_route.delete(
  "/post/:postId/comment/:commentId",
  requireAuth,
  blogController.deleteComment,
);

module.exports = blog_route;
