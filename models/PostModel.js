const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },

    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },

    tags: [
      {
        type: String,
      },
    ],

    comments: [
      {
        name: {
          type: String,
          default: "Anonymous",
        },
        text: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        likes: {
          type: Number,
          default: 0,
        },
        dislikes: {
          type: Number,
          default: 0,
        },
        replies: [
          {
            name: {
              type: String,
              default: "Anonymous",
            },
            text: {
              type: String,
              required: true,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
