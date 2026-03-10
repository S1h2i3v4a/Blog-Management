const express = require("express");
const app = express();

const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const cookieParser = require("cookie-parser");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const { attachUser } = require("./middlewares/auth");

const isBlog = require("./middlewares/isBlog");
const Post = require("./models/PostModel");

const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const blogRoute = require("./routes/blogRoute");

// MongoDB Connection
mongoose.connect(
  "mongodb+srv://shivamkeshari990_db_user:3SffPzK5NP9lnfWK@cluster0.cmvjqhr.mongodb.net/",
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);
app.use(isBlog);

// Serve static assets (CSS/JS/images)
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", adminRoute);
app.use("/", userRoute);
app.use("/", blogRoute);

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server);
app.set("io", io);

// Socket Connection
io.on("connection", (socket) => {
  logger.info("User connected", { socketId: socket.id });

  socket.on("post:like", async ({ postId }) => {
    try {
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likes: 1 } },
        { new: true },
      );
      if (post) {
        io.emit("post:updated", {
          postId: post._id.toString(),
          likes: post.likes,
          dislikes: post.dislikes,
        });
      }
    } catch (err) {
      logger.error("Error handling post:like", { error: err });
    }
  });

  socket.on("post:dislike", async ({ postId }) => {
    try {
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { dislikes: 1 } },
        { new: true },
      );
      if (post) {
        io.emit("post:updated", {
          postId: post._id.toString(),
          likes: post.likes,
          dislikes: post.dislikes,
        });
      }
    } catch (err) {
      logger.error("Error handling post:dislike", { error: err });
    }
  });

  socket.on("comment:like", async ({ postId, commentId }) => {
    try {
      const post = await Post.findOneAndUpdate(
        { _id: postId, "comments._id": commentId },
        { $inc: { "comments.$.likes": 1 } },
        { new: true },
      );
      if (post) {
        const comment = post.comments.id(commentId);
        io.emit("comment:updated", {
          postId: post._id.toString(),
          commentId,
          likes: comment?.likes || 0,
          dislikes: comment?.dislikes || 0,
        });
      }
    } catch (err) {
      logger.error("Error handling comment:like", { error: err });
    }
  });

  socket.on("comment:dislike", async ({ postId, commentId }) => {
    try {
      const post = await Post.findOneAndUpdate(
        { _id: postId, "comments._id": commentId },
        { $inc: { "comments.$.dislikes": 1 } },
        { new: true },
      );
      if (post) {
        const comment = post.comments.id(commentId);
        io.emit("comment:updated", {
          postId: post._id.toString(),
          commentId,
          likes: comment?.likes || 0,
          dislikes: comment?.dislikes || 0,
        });
      }
    } catch (err) {
      logger.error("Error handling comment:dislike", { error: err });
    }
  });
});

// Centralized error handler
app.use(errorHandler);

// Start Server
server.listen(3000, () => {
  logger.info("Server is running on port 3000");
});
