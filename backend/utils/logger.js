const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require("fs");

const logTransports = [
  new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
        return `[${timestamp || new Date().toISOString()}] ${level}: ${message}${metaStr}`;
      })
    ),
  }),
];

// In local or non-read-only environments, also write to files
try {
  const logsDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  logTransports.push(
    new transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: format.combine(format.timestamp(), format.json()),
    })
  );
} catch (e) {
  // If filesystem writing fails, console logging is already active
}

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: logTransports,
  exitOnError: false,
});

module.exports = logger;
