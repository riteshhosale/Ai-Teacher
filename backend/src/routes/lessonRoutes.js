const express = require("express");

const {
  generateLesson,
} = require("../controllers/lessonController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/generate",
  protect,
  generateLesson
);

module.exports = router;