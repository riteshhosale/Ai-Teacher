const express = require("express");

const {
  generateSpeech,
} = require("../controllers/speechController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/generate",
  protect,
  generateSpeech
);

module.exports = router;
