const rateLimit = require("express-rate-limit");

const SECRET_HEADER_VALUE = "secret";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
  skip: (req) => req.headers["x-secret-header"] === SECRET_HEADER_VALUE,
});

module.exports = limiter;