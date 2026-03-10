const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Backwards-compatible flag for existing code paths
  is_admin: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  resetPasswordToken: {
    type: String,
    default: "",
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
});

// Keep role in sync with is_admin for backwards compatibility
userSchema.pre("save", function () {
  if (this.is_admin) {
    this.role = "admin";
  } else if (!this.role) {
    this.role = "user";
  }
});

module.exports = mongoose.model("User", userSchema);
