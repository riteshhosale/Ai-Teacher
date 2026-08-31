const express = require("express");

const {
  createRealtimeSession,
} = require("../controllers/realtimeController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/session",
  protect,
  createRealtimeSession
);

module.exports = router;