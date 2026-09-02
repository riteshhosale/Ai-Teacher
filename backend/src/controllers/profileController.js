const User = require("../models/User");

// ==========================================
// GET CURRENT USER LEARNING PROFILE
// GET /api/profile
// ==========================================

const getProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).select("-password");

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
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const {
      level,
      existingKnowledge,
      learningGoal,
      teachingStyle,
      language,
      availableTime,
    } = req.body;

    const updateData = {};

    // Level
    if (level !== undefined) {
      const allowedLevels = [
        "beginner",
        "intermediate",
        "advanced",
      ];

      if (!allowedLevels.includes(level)) {
        return res.status(400).json({
          success: false,
          message:
            "Level must be beginner, intermediate, or advanced",
        });
      }

      updateData.level = level;
    }

    // Existing knowledge
    if (existingKnowledge !== undefined) {
      updateData.existingKnowledge =
        String(existingKnowledge).trim();
    }

    // Learning goal
    if (learningGoal !== undefined) {
      updateData.learningGoal =
        String(learningGoal).trim();
    }

    // Teaching style
    if (teachingStyle !== undefined) {
      updateData.teachingStyle =
        String(teachingStyle).trim();
    }

    // Language
    if (language !== undefined) {
      updateData.language =
        String(language).trim();
    }

    // Available time
    if (availableTime !== undefined) {
      const time = Number(availableTime);

      if (!Number.isFinite(time) || time < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Available time must be at least 5 minutes",
        });
      }

      updateData.availableTime = time;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

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