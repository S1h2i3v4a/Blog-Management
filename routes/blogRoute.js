const { showPosts } = require("../controllers/blogController");
const blogController = require("../controllers/blogController");
const express = require("express");
const blog_route = express();

blog_route.set("view engine", "ejs");
blog_route.set("views", "./views");

blog_route.use(express.static("public"));

blog_route.get("/", showPosts);
blog_route.get("/post/:id", blogController.showSinglePost);
blog_route.post("/post/:id", blogController.addComment);
blog_route.post("/do-reply", blogController.addReply);

module.exports = blog_route;
