const sessionSecret = process.env.SESSION_SECRET || "your_secret_key";

// JWT settings
const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret_key";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "2h";

// Reset password token expiry (ms)
const resetPasswordTokenExpiryMs = 1000 * 60 * 60; // 1 hour

const emailUser = process.env.EMAIL_USER || "shivamkesharishivkeshari990@gmail.com";
const Password = process.env.EMAIL_PASSWORD || "ftuatuhkqrzmxfyl";

module.exports = {
  sessionSecret,
  jwtSecret,
  jwtExpiresIn,
  resetPasswordTokenExpiryMs,
  emailUser,
  Password,
};
