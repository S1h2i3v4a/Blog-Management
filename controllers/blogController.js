const mongoose = require("mongoose");
const Post = require("../models/PostModel");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.emailUser,
    pass: config.Password,
  },
});

const showPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(
      1,
      Math.min(50, parseInt(req.query.limit || "10", 10)),
    );
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render("blog", {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

const showSinglePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("Invalid post id");
      err.statusCode = 400;
      return next(err);
    }

    const post = await Post.findById(id);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("post", { post });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { name, comment, email } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      return next(err);
    }

    const newComment = {
      name: name || "Anonymous",
      email,
      text: comment,
      replies: [],
    };

    post.comments.push(newComment);
    await post.save();

    const savedComment = post.comments[post.comments.length - 1];

    res.json({
      success: true,
      name: savedComment.name,
      email: savedComment.email,
      comment: savedComment.text,
      postId: post._id,
      commentId: savedComment._id,
    });
  } catch (err) {
    next(err);
  }
};

const addReply = async (req, res, next) => {
  try {
    const { postId, commentId, name, reply } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      return next(err);
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      const err = new Error("Comment not found");
      err.statusCode = 404;
      return next(err);
    }

    comment.replies.push({
      name: name || "Anonymous",
      text: reply,
    });

    await post.save();

    if (comment.email) {
      try {
        await transporter.sendMail({
          from: config.emailUser,
          to: comment.email,
          subject: "Someone replied to your comment 💬",
          html: `
            <h3>Hello ${comment.name},</h3>
            <p><b>${name || "Someone"}</b> replied to your comment:</p>
            <p style="background:#f2f2f2;padding:10px;border-radius:5px;">
              ${reply}
            </p>
            <br>
            <a href="http://localhost:3000/post/${postId}">
              View Discussion
            </a>
          `,
        });
      } catch (emailErr) {
        logger.warn("Failed to send reply email", { error: emailErr });
      }
    }

    res.json({
      success: true,
      name: name || "Anonymous",
      reply: reply,
    });
  } catch (err) {
    next(err);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { comment } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      return next(err);
    }

    const existingComment = post.comments.id(commentId);
    if (!existingComment) {
      const err = new Error("Comment not found");
      err.statusCode = 404;
      return next(err);
    }

    // Allow update if user is admin or comment author
    const isAdmin = req.user?.role === "admin";
    const isAuthor = req.user?.email === existingComment.email;
    if (!isAdmin && !isAuthor) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      return next(err);
    }

    existingComment.text = comment;
    await post.save();

    res.json({ success: true, comment: existingComment });
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error("Post not found");
      err.statusCode = 404;
      return next(err);
    }

    const existingComment = post.comments.id(commentId);
    if (!existingComment) {
      const err = new Error("Comment not found");
      err.statusCode = 404;
      return next(err);
    }

    const isAdmin = req.user?.role === "admin";
    const isAuthor = req.user?.email === existingComment.email;
    if (!isAdmin && !isAuthor) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      return next(err);
    }

    existingComment.remove();
    await post.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  showPosts,
  showSinglePost,
  addComment,
  addReply,
  updateComment,
  deleteComment,
};
