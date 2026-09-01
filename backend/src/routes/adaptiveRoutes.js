const express = require("express");

const {
  evaluateAnswer,
} = require("../controllers/adaptiveController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/evaluate",
  protect,
  evaluateAnswer
);

module.exports = router;
