const Lesson = require("../models/Lesson");
const TeachingVideo = require("../models/TeachingVideo");

const {
  generateAvatarVideo,
  getAvatarVideoStatus,
} = require("../services/avatarService");

const {
  generateLessonScenePlan,
} = require("../services/lessonSceneService");

// ==========================================
// GENERATE VIDEO + SCENE PLAN
// ==========================================

const generateVideo = async (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId is required",
      });
    }

    // ==========================================
    // FIND LESSON
    // ==========================================

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

    // ==========================================
    // GENERATE EDUCATIONAL SCENE PLAN WITH GEMINI
    // ==========================================

    console.log(
      "Generating teaching scene plan with Gemini..."
    );

    const videoPlan =
      await generateLessonScenePlan({
        topic:
          lesson.title ||
          lesson.topic ||
          "AI Teacher Lesson",

        level:
          lesson.level || "beginner",

        language:
          lesson.language || "English",

        introduction:
          lesson.introduction || "",

        explanation:
          lesson.explanation || "",

        examples:
          lesson.examples || [],

        demonstration:
          lesson.demonstration || "",

        summary:
          lesson.summary || "",
      });

    // ==========================================
    // VALIDATE SCENE PLAN
    // ==========================================

    if (
      !videoPlan ||
      !Array.isArray(videoPlan.scenes) ||
      videoPlan.scenes.length === 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          "No teaching scenes were generated",
      });
    }

    // ==========================================
    // CHECK EXISTING VIDEO
    // ==========================================

    let existingVideo =
      await TeachingVideo.findOne({
        lessonId: lesson._id,
        userId,
      });

    // ==========================================
    // IF ALREADY PROCESSING
    // ==========================================

    if (
      existingVideo &&
      existingVideo.status === "processing" &&
      existingVideo.providerVideoId
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Teaching video is already being generated",

        videoPlan: {
          title:
            existingVideo.title ||
            videoPlan.title ||
            lesson.topic ||
            "AI Teacher Lesson",

          description:
            videoPlan.description ||
            "Learn this topic through AI-generated educational scenes.",

          language:
            videoPlan.language ||
            lesson.language ||
            "English",

          scenes:
            existingVideo.scenes ||
            videoPlan.scenes,
        },

        video: existingVideo,
      });
    }

    // ==========================================
    // IF ALREADY COMPLETED
    // ==========================================

    if (
      existingVideo &&
      existingVideo.status === "completed" &&
      existingVideo.videoUrl
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Teaching video already exists",

        videoPlan: {
          title:
            existingVideo.title ||
            videoPlan.title ||
            lesson.topic ||
            "AI Teacher Lesson",

          description:
            videoPlan.description ||
            "Learn this topic through AI-generated educational scenes.",

          language:
            videoPlan.language ||
            lesson.language ||
            "English",

          scenes:
            existingVideo.scenes ||
            videoPlan.scenes,
        },

        video: existingVideo,
      });
    }

    // ==========================================
    // COMBINE ALL SCENE SCRIPTS
    // ==========================================

    const script = videoPlan.scenes
      .map((scene) => scene.script || "")
      .filter(
        (sceneScript) =>
          sceneScript.trim().length > 0
      )
      .join("\n\n");

    if (!script.trim()) {
      return res.status(500).json({
        success: false,
        message:
          "Generated scenes do not contain any teaching script",
      });
    }

    // ==========================================
    // CREATE DATABASE VIDEO RECORD
    // ==========================================

    if (!existingVideo) {
      existingVideo =
        await TeachingVideo.create({
          userId,

          lessonId: lesson._id,

          title:
            videoPlan.title ||
            lesson.title ||
            lesson.topic ||
            "AI Teacher Lesson",

          provider: "",

          providerVideoId: "",

          status: "processing",

          scenes: videoPlan.scenes,

          videoUrl: null,

          duration: null,

          error: null,
        });
    } else {
      existingVideo.title =
        videoPlan.title ||
        lesson.title ||
        lesson.topic ||
        "AI Teacher Lesson";

      existingVideo.scenes =
        videoPlan.scenes;

      existingVideo.status =
        "processing";

      existingVideo.videoUrl = null;

      existingVideo.error = null;

      await existingVideo.save();
    }

    // ==========================================
    // GENERATE SYNTHESIA AVATAR VIDEO
    // ==========================================

    console.log(
      "Sending teaching script to Synthesia..."
    );

    const avatarVideo =
      await generateAvatarVideo({
        title:
          videoPlan.title ||
          lesson.title ||
          lesson.topic ||
          "AI Teacher Lesson",

        script,
      });

    // ==========================================
    // SAVE SYNTHESIA RESULT
    // ==========================================

    existingVideo.provider =
      avatarVideo?.provider ||
      "synthesia";

    existingVideo.providerVideoId =
      avatarVideo?.providerVideoId ||
      "";

    existingVideo.status =
      avatarVideo?.status ||
      "processing";

    existingVideo.videoUrl =
      avatarVideo?.videoUrl ||
      null;

    await existingVideo.save();

    // ==========================================
    // FINAL VIDEO PLAN
    // ==========================================

    const finalVideoPlan = {
      title:
        videoPlan.title ||
        lesson.title ||
        lesson.topic ||
        "AI Teacher Lesson",

      description:
        videoPlan.description ||
        "Learn this topic through AI-generated educational scenes.",

      language:
        videoPlan.language ||
        lesson.language ||
        "English",

      scenes:
        videoPlan.scenes,
    };

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message:
        "AI Teacher video generation started",

      videoPlan: finalVideoPlan,

      video: existingVideo,
    });
  } catch (error) {
    console.error(
      "Generate video error:",
      error.response?.data ||
        error.message
    );

    // ==========================================
    // GEMINI 429
    // ==========================================

    if (
      error?.status === 429 ||
      error?.response?.status === 429
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded. Please try again later.",
      });
    }

    // ==========================================
    // GEMINI 503
    // ==========================================

    if (
      error?.status === 503 ||
      error?.response?.status === 503
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini is temporarily unavailable. Please try again.",
      });
    }

    // ==========================================
    // GENERAL ERROR
    // ==========================================

    return res.status(500).json({
      success: false,

      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to generate AI teacher video",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// GET VIDEO STATUS
// ==========================================

const getVideoStatus = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.userId ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    const video =
      await TeachingVideo.findOne({
        _id: req.params.id,
        userId,
      });

    if (!video) {
      return res.status(404).json({
        success: false,
        message:
          "Teaching video not found",
      });
    }

    // ==========================================
    // ALREADY COMPLETED
    // ==========================================

    if (
      video.status === "completed" &&
      video.videoUrl
    ) {
      return res.status(200).json({
        success: true,
        video,
      });
    }

    // ==========================================
    // CHECK SYNTHESIA
    // ==========================================

    if (
      video.provider === "synthesia" &&
      video.providerVideoId
    ) {
      const result =
        await getAvatarVideoStatus({
          providerVideoId:
            video.providerVideoId,
        });

      // Update status
      if (result?.status) {
        video.status =
          result.status;
      }

      // Update video URL
      if (result?.videoUrl) {
        video.videoUrl =
          result.videoUrl;
      }

      // Update duration
      if (result?.duration) {
        video.duration =
          result.duration;
      }

      // Update error
      if (result?.error) {
        video.error =
          result.error;
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
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,

      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to get video status",
    });
  }
};

// ==========================================
// GET VIDEO FOR LESSON
// ==========================================

const getLessonVideo = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.userId ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    const video =
      await TeachingVideo.findOne({
        lessonId: req.params.lessonId,
        userId,
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

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  generateVideo,
  getVideoStatus,
  getLessonVideo,
};