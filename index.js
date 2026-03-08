const express = require("express");
const app = express();

const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const isBlog = require("./middlewares/isBlog");

const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const blogRoute = require("./routes/blogRoute");

// MongoDB Connection
mongoose.connect(
  "mongodb+srv://shivamkeshari990_db_user:3SffPzK5NP9lnfWK@cluster0.cmvjqhr.mongodb.net/",
);

// Middleware
app.use(isBlog);

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
  console.log("User connected:", socket.id);
});

// Start Server
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
