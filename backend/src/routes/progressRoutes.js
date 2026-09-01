const express = require("express");

const {
  saveProgress,
  getProgress,
  getProgressSummary,
} = require("../controllers/progressController");

const { protect } = require(
  "../middleware/authMiddleware"
);

const router = express.Router();


router.post(
  "/",
  protect,
  saveProgress
);


router.get(
  "/",
  protect,
  getProgress
);


router.get(
  "/summary",
  protect,
  getProgressSummary
);


module.exports = router;