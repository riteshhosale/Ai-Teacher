const LearningProgress = require(
  "../models/LearningProgress"
);


// ===============================
// SAVE LESSON PROGRESS
// ===============================

const saveProgress = async (req, res) => {
  try {
    const {
      topic,
      level,
      language,
      score,
      totalQuestions,
      weakTopics,
      nextTopic,
    } = req.body;

    if (
      !topic ||
      !level ||
      !language
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Topic, level and language are required",
      });
    }

    const percentage =
      totalQuestions > 0
        ? Math.round(
            (score / totalQuestions) * 100
          )
        : 0;


    const progress =
      await LearningProgress.create({
        userId: req.user._id,

        topic,

        level,

        language,

        score: score || 0,

        totalQuestions:
          totalQuestions || 0,

        percentage,

        completed: true,

        weakTopics:
          weakTopics || [],

        nextTopic:
          nextTopic || "",

        completedAt: new Date(),
      });


    res.status(201).json({
      success: true,

      message:
        "Learning progress saved",

      progress,
    });

  } catch (error) {

    console.error(
      "Save progress error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to save progress",
    });
  }
};


// ===============================
// GET USER PROGRESS
// ===============================

const getProgress = async (req, res) => {
  try {

    const progress =
      await LearningProgress
        .find({
          userId: req.user._id,
        })
        .sort({
          createdAt: -1,
        });


    res.status(200).json({
      success: true,
      progress,
    });

  } catch (error) {

    console.error(
      "Get progress error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to get progress",
    });
  }
};


// ===============================
// GET PROGRESS SUMMARY
// ===============================

const getProgressSummary = async (
  req,
  res
) => {
  try {

    const progress =
      await LearningProgress.find({
        userId: req.user._id,
      });


    const completedLessons =
      progress.filter(
        (item) => item.completed
      ).length;


    const totalQuestions =
      progress.reduce(
        (total, item) =>
          total + item.totalQuestions,
        0
      );


    const totalCorrect =
      progress.reduce(
        (total, item) =>
          total + item.score,
        0
      );


    const averageScore =
      totalQuestions > 0
        ? Math.round(
            (totalCorrect /
              totalQuestions) *
              100
          )
        : 0;


    const weakTopics = [
      ...new Set(
        progress.flatMap(
          (item) =>
            item.weakTopics || []
        )
      ),
    ];


    const latest =
      progress.length > 0
        ? progress[
            progress.length - 1
          ]
        : null;


    res.status(200).json({
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

    res.status(500).json({
      success: false,
      message:
        "Failed to get progress summary",
    });
  }
};


module.exports = {
  saveProgress,
  getProgress,
  getProgressSummary,
};