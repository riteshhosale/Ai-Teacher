const express = require("express");

const {
  generateLearningPath,
} = require(
  "../controllers/recommendationController"
);

const { protect } = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.get(
  "/learning-path",
  protect,
  generateLearningPath
);

module.exports = router;