const Lesson = require("../models/Lesson");


// ===============================
// GET SINGLE LESSON
// ===============================

const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      success: true,
      lesson,
    });

  } catch (error) {
    console.error(
      "Get lesson error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to get lesson",
    });
  }
};


// ===============================
// GET LESSON HISTORY
// ===============================

const getLessonHistory = async (
  req,
  res
) => {
  try {
    const lessons = await Lesson.find({
      userId: req.user._id,
    })
      .sort({
        createdAt: -1,
      })
      .select(
        "topic level language score questions completed nextTopic createdAt"
      );

    res.status(200).json({
      success: true,
      lessons,
    });

  } catch (error) {
    console.error(
      "Lesson history error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to get lesson history",
    });
  }
};


// ===============================
// COMPLETE LESSON
// ===============================

const completeLesson = async (
  req,
  res
) => {
  try {
    const {
      score,
    } = req.body;

    const lesson = await Lesson.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    lesson.score =
      typeof score === "number"
        ? score
        : lesson.score;

    lesson.completed = true;

    lesson.completedAt =
      new Date();

    await lesson.save();

    res.status(200).json({
      success: true,
      message:
        "Lesson completed successfully",
      lesson,
    });

  } catch (error) {
    console.error(
      "Complete lesson error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to complete lesson",
    });
  }
};


module.exports = {
  getLesson,
  getLessonHistory,
  completeLesson,
};