const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const { attachUser } = require("./middlewares/auth");
const isBlog = require("./middlewares/isBlog");
const Post = require("./models/PostModel");

const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const blogRoute = require("./routes/blogRoute");

const app = express();

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  logger.warn(
    "⚠️ MONGODB_URI is not set in environment variables! Using fallback. Please configure MONGODB_URI in your Render service environment."
  );
}

const connectionString =
  mongoURI ||
  "mongodb+srv://shivamkeshari990_db_user:3SffPzK5NP9lnfWK@cluster0.cmvjqhr.mongodb.net/";

mongoose
  .connect(connectionString, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => logger.info("MongoDB connected successfully"))
  .catch((err) => {
    logger.error("MongoDB connection error", {
      message: err.message,
      code: err.code,
      hint:
        err.code === "ENOTFOUND"
          ? "Host not found: Your MongoDB Atlas cluster might be PAUSED or deleted. Please visit cloud.mongodb.com and click Resume on your cluster."
          : "Check your MongoDB URI credentials and IP whitelist in Atlas.",
    });
  });

// CORS configuration - allow all Vercel domains, localhost, and custom frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    // Allow any origin in production to prevent hard-to-debug deployment blocks
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);

// Serve static assets (uploaded images)
app.use(express.static(path.join(__dirname, "public")));

// Blog check middleware
app.use("/api", isBlog);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/admin", adminRoute);
app.use("/api/user", userRoute);
app.use("/api/blog", blogRoute);

// Centralized error handler
app.use(errorHandler);

// Create HTTP Server & Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

// Socket.io Real-time connection
io.on("connection", (socket) => {
  logger.info("User connected to socket", { socketId: socket.id });

  socket.on("post:like", async ({ postId }) => {
    try {
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likes: 1 } },
        { new: true }
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
        { new: true }
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
        { new: true }
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
        { new: true }
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

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Backend API server running on port ${PORT}`);
});
