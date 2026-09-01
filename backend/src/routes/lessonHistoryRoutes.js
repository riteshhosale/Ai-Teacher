const express = require("express");

const {
  getLesson,
  getLessonHistory,
  completeLesson,
} = require(
  "../controllers/lessonHistoryController"
);

const { protect } = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.get(
  "/",
  protect,
  getLessonHistory
);

router.get(
  "/:id",
  protect,
  getLesson
);

router.patch(
  "/:id/complete",
  protect,
  completeLesson
);

module.exports = router;