const mongoose = require("mongoose");
const User = require("../models/User");

// ==========================================
// HELPERS
// ==========================================

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId;
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

// ==========================================
// GET CURRENT USER LEARNING PROFILE
// GET /api/profile
// ==========================================

const getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(userId)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get learning profile",
    });
  }
};

// ==========================================
// UPDATE USER LEARNING PROFILE
// PUT /api/profile
// ==========================================

const updateProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Prevent crashes when req.body is missing
    const body =
      req.body && typeof req.body === "object" ? req.body : {};

    const {
      level,
      existingKnowledge,
      learningGoal,
      teachingStyle,
      language,
      availableTime,
    } = body;

    const updateData = {};

    // ==========================================
    // LEVEL
    // ==========================================

    if (level !== undefined) {
      const allowedLevels = [
        "beginner",
        "intermediate",
        "advanced",
      ];

      if (
        typeof level !== "string" ||
        !allowedLevels.includes(level.trim().toLowerCase())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Level must be beginner, intermediate, or advanced",
        });
      }

      updateData.level = level.trim().toLowerCase();
    }

    // ==========================================
    // EXISTING KNOWLEDGE
    // ==========================================

    if (existingKnowledge !== undefined) {
      if (typeof existingKnowledge !== "string") {
        return res.status(400).json({
          success: false,
          message: "Existing knowledge must be a string",
        });
      }

      const value = existingKnowledge.trim();

      if (value.length > 2000) {
        return res.status(400).json({
          success: false,
          message:
            "Existing knowledge cannot exceed 2000 characters",
        });
      }

      updateData.existingKnowledge = value;
    }

    // ==========================================
    // LEARNING GOAL
    // ==========================================

    if (learningGoal !== undefined) {
      if (typeof learningGoal !== "string") {
        return res.status(400).json({
          success: false,
          message: "Learning goal must be a string",
        });
      }

      const value = learningGoal.trim();

      if (value.length > 1000) {
        return res.status(400).json({
          success: false,
          message:
            "Learning goal cannot exceed 1000 characters",
        });
      }

      updateData.learningGoal = value;
    }

    // ==========================================
    // TEACHING STYLE
    // ==========================================

    if (teachingStyle !== undefined) {
      if (typeof teachingStyle !== "string") {
        return res.status(400).json({
          success: false,
          message: "Teaching style must be a string",
        });
      }

      const value = teachingStyle.trim();

      if (value.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Teaching style cannot exceed 500 characters",
        });
      }

      updateData.teachingStyle = value;
    }

    // ==========================================
    // LANGUAGE
    // ==========================================

    if (language !== undefined) {
      if (typeof language !== "string") {
        return res.status(400).json({
          success: false,
          message: "Language must be a string",
        });
      }

      const value = language.trim();

      if (value.length === 0 || value.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            "Language must be between 1 and 100 characters",
        });
      }

      updateData.language = value;
    }

    // ==========================================
    // AVAILABLE TIME
    // ==========================================

    if (availableTime !== undefined) {
      const time = Number(availableTime);

      if (
        !Number.isFinite(time) ||
        !Number.isInteger(time) ||
        time < 5 ||
        time > 1440
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Available time must be a whole number between 5 and 1440 minutes",
        });
      }

      updateData.availableTime = time;
    }

    // ==========================================
    // NO VALID FIELDS
    // ==========================================

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
    }

    // ==========================================
    // UPDATE USER
    // ==========================================

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Learning profile updated successfully",
      profile: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update learning profile",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};