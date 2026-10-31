const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  const status = err.statusCode || 500;
  logger.error(err.message, { stack: err.stack });
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
