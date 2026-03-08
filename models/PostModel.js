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
