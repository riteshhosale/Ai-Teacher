const Lesson = require("../models/Lesson");
const TeachingVideo = require("../models/TeachingVideo");

const {
  generateTeachingScenes,
} = require("../services/lessonSceneService");

const {
  generateAvatarVideo,
  getAvatarVideoStatus,
} = require("../services/avatarService");

// ======================================
// GENERATE TEACHING VIDEO
// ======================================

const generateVideo = async (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId is required",
      });
    }

    // ======================================
    // USER ID
    // ======================================

    const userId =
      req.user?._id ||
      req.user?.userId ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ======================================
    // FIND LESSON
    // ======================================

    const lesson = await Lesson.findOne({
      _id: lessonId,
      userId,
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // ======================================
    // CHECK EXISTING VIDEO
    // ======================================

    const existingVideo =
      await TeachingVideo.findOne({
        lessonId: lesson._id,
        userId,
      });

    if (
      existingVideo &&
      existingVideo.status === "completed" &&
      existingVideo.videoUrl
    ) {
      return res.status(200).json({
        success: true,
        message: "Teaching video already exists",
        video: existingVideo,
      });
    }

    // ======================================
    // GEMINI - GENERATE TEACHING SCENES
    // ======================================

    console.log(
      "Generating teaching scenes with Gemini..."
    );

    const scenePlan =
      await generateTeachingScenes(lesson);

    // ======================================
    // VALIDATE GEMINI RESULT
    // ======================================

    if (
      !scenePlan ||
      !Array.isArray(scenePlan.scenes) ||
      scenePlan.scenes.length === 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Gemini did not generate valid teaching scenes",
      });
    }

    // ======================================
    // COMBINE SCENE SCRIPTS
    // ======================================

    const script =
      scenePlan.scenes
        .map(
          (scene) =>
            scene.script || ""
        )
        .filter(Boolean)
        .join("\n\n");

    if (!script.trim()) {
      return res.status(500).json({
        success: false,
        message:
          "Generated teaching scenes contain no script",
      });
    }

    // ======================================
    // CREATE / UPDATE DATABASE RECORD
    // ======================================

    let teachingVideo =
      existingVideo;

    if (!teachingVideo) {
      teachingVideo =
        await TeachingVideo.create({
          userId,

          lessonId: lesson._id,

          title:
            scenePlan.title ||
            lesson.topic ||
            "AI Teaching Video",

          status: "processing",

          scenes:
            scenePlan.scenes,

          provider: "",

          providerVideoId: "",

          videoUrl: "",
        });
    } else {
      teachingVideo.title =
        scenePlan.title ||
        lesson.topic ||
        "AI Teaching Video";

      teachingVideo.scenes =
        scenePlan.scenes;

      teachingVideo.status =
        "processing";
    }

    await teachingVideo.save();

    // ======================================
    // AVATAR VIDEO GENERATION
    // ======================================

    console.log(
      "Sending teaching script to avatar provider..."
    );

    const avatarResult =
  await generateAvatarVideo({
    script,

    title:
      lesson.topic,
  });

    // ======================================
    // SAVE AVATAR RESULT
    // ======================================

    teachingVideo.provider =
      avatarResult?.provider || "";

    teachingVideo.providerVideoId =
      avatarResult?.providerVideoId || "";

    teachingVideo.status =
      avatarResult?.status ||
      "processing";

    teachingVideo.videoUrl =
      avatarResult?.videoUrl || "";

    await teachingVideo.save();

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      success: true,

      message:
        "Teaching video generation started",

      video: teachingVideo,
    });

  } catch (error) {
    console.error(
      "Generate video error:",
      error
    );

    // ======================================
    // GEMINI ERROR
    // ======================================

    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded. Please try again later.",
      });
    }

    if (error?.status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini is temporarily unavailable. Please try again.",
      });
    }

    // ======================================
    // GENERAL ERROR
    // ======================================

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate teaching video",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================
// CHECK VIDEO STATUS
// ======================================

const getVideoStatus = async (
  req,
  res
) => {
  try {
    const video =
      await TeachingVideo.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // ======================================
    // CHECK AVATAR STATUS
    // ======================================

    if (
      video.status === "processing" &&
      video.providerVideoId
    ) {
      const result =
        await getAvatarVideoStatus({
          providerVideoId:
            video.providerVideoId,
        });

      if (result?.status) {
        video.status =
          result.status;
      }

      if (result?.videoUrl) {
        video.videoUrl =
          result.videoUrl;
      }

      await video.save();
    }

    return res.status(200).json({
      success: true,
      video,
    });

  } catch (error) {
    console.error(
      "Video status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check video status",
    });
  }
};

// ======================================
// GET VIDEO FOR LESSON
// ======================================

const getLessonVideo = async (
  req,
  res
) => {
  try {
    const video =
      await TeachingVideo.findOne({
        lessonId:
          req.params.lessonId,

        userId:
          req.user._id,
      });

    if (!video) {
      return res.status(404).json({
        success: false,
        message:
          "Teaching video not found",
      });
    }

    return res.status(200).json({
      success: true,
      video,
    });

  } catch (error) {
    console.error(
      "Get lesson video error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get teaching video",
    });
  }
};

// ======================================
// EXPORT
// ======================================

module.exports = {
  generateVideo,
  getVideoStatus,
  getLessonVideo,
};
