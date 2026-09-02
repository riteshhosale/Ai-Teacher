const express = require("express");

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get current student's learning profile
router.get("/", protect, getProfile);

// Update current student's learning profile
router.put("/", protect, updateProfile);

module.exports = router;