const express = require("express");

const {
  generateVideo,
  getVideoStatus,
  getLessonVideo,
} = require("../controllers/videoController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/generate", protect, generateVideo);

router.post("/generate-scenes", protect, generateVideo);

router.get("/status/:id", protect, getVideoStatus);

router.get("/lesson/:lessonId", protect, getLessonVideo);

module.exports = router;
