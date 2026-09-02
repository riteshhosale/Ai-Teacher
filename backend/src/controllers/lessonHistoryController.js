const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");

// =====================================================
// HELPERS
// =====================================================

const getUserId = (req) => {
  const rawUserId =
    req.user?._id ??
    req.user?.userId ??
    req.user?.id;

  return rawUserId
    ? String(rawUserId)
    : null;
};

// =====================================================
// GET SINGLE LESSON
// =====================================================

const getLesson = async (req, res) => {
  try {
    const userId = getUserId(req);
    const lessonId = req.params?.id;

    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    // -------------------------------------------------
    // VALIDATE LESSON ID
    // -------------------------------------------------

    if (
      !lessonId ||
      !mongoose.Types.ObjectId.isValid(
        lessonId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    // -------------------------------------------------
    // FIND LESSON
    // -------------------------------------------------

    const lesson =
      await Lesson.findOne({
        _id: lessonId,
        userId,
      }).lean();

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      lesson,
    });
  } catch (error) {
    console.error(
      "Get lesson error:",
      error?.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get lesson",
    });
  }
};

// =====================================================
// GET LESSON HISTORY
// =====================================================

const getLessonHistory = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    // -------------------------------------------------
    // GET LESSONS
    // -------------------------------------------------

    const lessons =
      await Lesson.find({
        userId,
      })
        .sort({
          createdAt: -1,
        })
        .select(
          "_id topic level language score questions completed completedAt nextTopic createdAt"
        )
        .lean();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      count: lessons.length,
      lessons,
    });
  } catch (error) {
    console.error(
      "Lesson history error:",
      error?.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get lesson history",
    });
  }
};

// =====================================================
// COMPLETE LESSON
// =====================================================

const completeLesson = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);
    const lessonId = req.params?.id;

    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    // -------------------------------------------------
    // VALIDATE LESSON ID
    // -------------------------------------------------

    if (
      !lessonId ||
      !mongoose.Types.ObjectId.isValid(
        lessonId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    // -------------------------------------------------
    // FIND LESSON
    // -------------------------------------------------

    const lesson =
      await Lesson.findOne({
        _id: lessonId,
        userId,
      });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // -------------------------------------------------
    // PREVENT RE-COMPLETION
    // -------------------------------------------------

    if (lesson.completed) {
      return res.status(409).json({
        success: false,
        message:
          "Lesson has already been completed",
        lesson,
      });
    }

    // -------------------------------------------------
    // CALCULATE SCORE FROM QUESTIONS
    // -------------------------------------------------
    //
    // IMPORTANT:
    // Do NOT trust the score from req.body.
    //
    // The frontend can be modified by the user.
    //
    // The database's question results should be
    // the source of truth.

    const questions =
      Array.isArray(lesson.questions)
        ? lesson.questions
        : [];

    const totalQuestions =
      questions.length;

    const correctAnswers =
      questions.filter(
        (question) =>
          question?.isCorrect === true
      ).length;

    const calculatedScore =
      totalQuestions > 0
        ? Math.round(
            (correctAnswers /
              totalQuestions) *
              100
          )
        : 0;

    // -------------------------------------------------
    // SAVE COMPLETION
    // -------------------------------------------------

    lesson.score =
      calculatedScore;

    lesson.completed = true;

    lesson.completedAt =
      new Date();

    await lesson.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Lesson completed successfully",

      lesson,

      result: {
        totalQuestions,
        correctAnswers,
        score: calculatedScore,
      },
    });
  } catch (error) {
    console.error(
      "Complete lesson error:",
      error?.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to complete lesson",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getLesson,
  getLessonHistory,
  completeLesson,
};
