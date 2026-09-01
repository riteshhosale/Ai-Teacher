const express = require("express");

const {
  generateAssessmentReport,
} = require("../controllers/assessmentController");

const { protect } = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.post(
  "/report",
  protect,
  generateAssessmentReport
);

module.exports = router;