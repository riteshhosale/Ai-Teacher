const mongoose = require("mongoose");
const LearningProgress = require("../models/LearningProgress");

// ==========================================
// HELPERS
// ==========================================

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId;
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// SAVE LESSON PROGRESS
// POST /api/progress
// ==========================================

const saveProgress = async (req, res) => {
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

    const body =
      req.body && typeof req.body === "object"
        ? req.body
        : {};

    const {
      topic,
      level,
      language,
      score,
      totalQuestions,
      weakTopics,
      nextTopic,
    } = body;

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (
      typeof topic !== "string" ||
      !topic.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Topic is required",
      });
    }

    if (
      typeof level !== "string" ||
      !level.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Level is required",
      });
    }

    if (
      typeof language !== "string" ||
      !language.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Language is required",
      });
    }

    // ==========================================
    // VALIDATE TOTAL QUESTIONS
    // ==========================================

    const parsedTotalQuestions = Number(totalQuestions);

    if (
      !Number.isInteger(parsedTotalQuestions) ||
      parsedTotalQuestions < 1 ||
      parsedTotalQuestions > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Total questions must be a whole number between 1 and 100",
      });
    }

    // ==========================================
    // VALIDATE SCORE
    // ==========================================

    const parsedScore = Number(score);

    if (
      !Number.isInteger(parsedScore) ||
      parsedScore < 0 ||
      parsedScore > parsedTotalQuestions
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Score must be a whole number between 0 and total questions",
      });
    }

    // ==========================================
    // CALCULATE PERCENTAGE
    // ==========================================

    const percentage = Math.round(
      (parsedScore / parsedTotalQuestions) * 100
    );

    // ==========================================
    // VALIDATE WEAK TOPICS
    // ==========================================

    let normalizedWeakTopics = [];

    if (weakTopics !== undefined) {
      if (!Array.isArray(weakTopics)) {
        return res.status(400).json({
          success: false,
          message: "Weak topics must be an array",
        });
      }

      if (weakTopics.length > 50) {
        return res.status(400).json({
          success: false,
          message:
            "Too many weak topics were provided",
        });
      }

      normalizedWeakTopics = weakTopics
        .filter(
          (topic) =>
            typeof topic === "string"
        )
        .map((topic) => topic.trim())
        .filter(Boolean)
        .slice(0, 50);
    }

    // ==========================================
    // VALIDATE NEXT TOPIC
    // ==========================================

    let normalizedNextTopic = "";

    if (nextTopic !== undefined) {
      if (typeof nextTopic !== "string") {
        return res.status(400).json({
          success: false,
          message: "Next topic must be a string",
        });
      }

      normalizedNextTopic =
        nextTopic.trim().slice(0, 500);
    }

    // ==========================================
    // CREATE PROGRESS
    // ==========================================

    const progress =
      await LearningProgress.create({
        userId,

        topic: topic.trim().slice(0, 500),

        level: level.trim().toLowerCase(),

        language: language.trim().slice(0, 100),

        score: parsedScore,

        totalQuestions: parsedTotalQuestions,

        percentage,

        completed: true,

        weakTopics: normalizedWeakTopics,

        nextTopic: normalizedNextTopic,

        completedAt: new Date(),
      });

    return res.status(201).json({
      success: true,
      message: "Learning progress saved",
      progress,
    });
  } catch (error) {
    console.error("Save progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save progress",
    });
  }
};

// ==========================================
// GET USER PROGRESS
// GET /api/progress
// ==========================================

const getProgress = async (req, res) => {
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

    const progress = await LearningProgress.find({
      userId,
    })
      .sort({
        completedAt: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Get progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get progress",
    });
  }
};

// ==========================================
// GET PROGRESS SUMMARY
// GET /api/progress/summary
// ==========================================

const getProgressSummary = async (req, res) => {
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

    // ==========================================
    // GET ALL USER PROGRESS
    // ==========================================

    const progress = await LearningProgress.find({
      userId,
    })
      .sort({
        completedAt: -1,
        createdAt: -1,
      })
      .lean();

    // ==========================================
    // BASIC SUMMARY
    // ==========================================

    const completedLessons = progress.filter(
      (item) => item.completed === true
    ).length;

    const totalQuestions = progress.reduce(
      (total, item) =>
        total + (Number(item.totalQuestions) || 0),
      0
    );

    const totalCorrect = progress.reduce(
      (total, item) =>
        total + (Number(item.score) || 0),
      0
    );

    const averageScore =
      totalQuestions > 0
        ? Math.round(
            (totalCorrect / totalQuestions) * 100
          )
        : 0;

    // ==========================================
    // UNIQUE WEAK TOPICS
    // ==========================================

    const weakTopics = [
      ...new Set(
        progress.flatMap((item) =>
          Array.isArray(item.weakTopics)
            ? item.weakTopics
            : []
        )
      ),
    ];

    // ==========================================
    // LATEST PROGRESS
    // ==========================================

    const latest =
      progress.length > 0
        ? progress[0]
        : null;

    return res.status(200).json({
      success: true,

      summary: {
        completedLessons,

        totalQuestions,

        totalCorrect,

        averageScore,

        weakTopics,

        nextTopic:
          latest?.nextTopic || "",
      },
    });
  } catch (error) {
    console.error(
      "Progress summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get progress summary",
    });
  }
};

module.exports = {
  saveProgress,
  getProgress,
  getProgressSummary,
};