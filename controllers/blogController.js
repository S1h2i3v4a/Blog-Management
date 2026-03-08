const Post = require("../models/PostModel");

const nodemailer = require("nodemailer");
const config = require("../config/config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.emailUser,
    pass: config.Password,
  },
});

module.exports = transporter;

const showPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render("blog", { posts });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching posts");
  }
};
const mongoose = require("mongoose");

const showSinglePost = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ VERY IMPORTANT
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid post id");
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.render("post", { post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching post");
  }
};

const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { name, comment, email } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const newComment = {
      name: name || "Anonymous",
      email: email, // ✅ Email bhi save karna hai
      text: comment,
      replies: [], // ✅ Important for replies
    };

    post.comments.push(newComment);

    await post.save();

    // ✅ Last added comment ka id nikal lo
    const savedComment = post.comments[post.comments.length - 1];

    res.json({
      success: true,
      name: savedComment.name,
      email: savedComment.email,
      comment: savedComment.text,
      postId: post._id, // ✅ Needed for reply form
      commentId: savedComment._id, // ✅ Very important
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
    });
  }
};

const addReply = async (req, res) => {
  try {
    const { postId, commentId, name, reply } = req.body;

    const post = await Post.findById(postId);
    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.json({ success: false });
    }

    // Reply push karo
    comment.replies.push({
      name: name || "Anonymous",
      text: reply,
    });

    await post.save();

    // 🔥 EMAIL SEND KARO
    if (comment.email) {
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
    }

    res.json({
      success: true,
      name: name || "Anonymous",
      reply: reply,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
};

module.exports = { showPosts, showSinglePost, addComment, addReply };
