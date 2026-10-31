const nodemailer = require("nodemailer");
const Post = require("../models/PostModel");
const { emailUser, Password } = require("../config/config");
const logger = require("../utils/logger");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * GET /api/blog/posts?page=1&limit=10
 * Return paginated posts.
 */
const showPosts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blog/post/:id
 * Return a single post by ID.
 */
const showSinglePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blog/post/:id/comment
 * Add a comment to a post.
 */
const addComment = async (req, res, next) => {
  try {
    const { name, email, text } = req.body;
    const commentBody = text || req.body.comment;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = { name: name || "Anonymous", email, text: commentBody };
    post.comments.push(comment);
    await post.save();

    // Get the saved comment (last one in the array)
    const savedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: {
        name: savedComment.name,
        email: savedComment.email,
        text: savedComment.text,
        _id: savedComment._id,
        postId: post._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blog/post/:id/reply
 * Add a reply to a comment and send email notification to the comment author.
 */
const addReply = async (req, res, next) => {
  try {
    const { commentId, name, text } = req.body;
    const targetCommentId = commentId || req.body.commentId;
    const replyText = text || req.body.reply;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(targetCommentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const reply = { name: name || "Anonymous", text: replyText };
    comment.replies.push(reply);
    await post.save();

    // Send email notification to comment author
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: Password,
        },
      });

      const postLink = `${FRONTEND_URL}/post.html?id=${post._id}`;

      const mailOptions = {
        from: emailUser,
        to: comment.email,
        subject: "New reply to your comment",
        html: `
          <h2>New Reply</h2>
          <p>Hi ${comment.name},</p>
          <p><strong>${name}</strong> replied to your comment:</p>
          <blockquote>${text}</blockquote>
          <p>View the post: <a href="${postLink}">${postLink}</a></p>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Reply notification email sent to ${comment.email}`);
    } catch (emailError) {
      // Log but don't fail the request if email fails
      logger.error("Failed to send reply notification email", {
        error: emailError.message,
      });
    }

    const savedReply = comment.replies[comment.replies.length - 1];

    res.status(201).json({
      success: true,
      reply: {
        name: savedReply.name,
        text: savedReply.text,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/blog/post/:postId/comment/:commentId
 * Update a comment's text.
 */
const updateComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    comment.text = text;
    await post.save();

    res.status(200).json({
      success: true,
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/blog/post/:postId/comment/:commentId
 * Delete a comment from a post.
 */
const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    comment.deleteOne();
    await post.save();

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
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
