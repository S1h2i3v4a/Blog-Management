const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // If response already sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (err.details) {
    response.details = err.details;
  }

  logger.error(err.message, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  // Send JSON for API requests and fallback to plain text for others
  if (req.accepts("json")) {
    return res.status(statusCode).json(response);
  }

  return res.status(statusCode).send(response.message);
};

module.exports = errorHandler;
