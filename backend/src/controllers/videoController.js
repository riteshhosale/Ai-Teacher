const mongoose = require("mongoose");

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
// HELPERS
// ==========================================

const getUserId = (req) => {
  return req.user?._id || req.user?.userId || req.user?.id;
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getErrorStatus = (error) => {
  return (
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    null
  );
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unknown error"
  );
};

const ALLOWED_VIDEO_STATUSES = [
  "processing",
  "completed",
  "failed",
];


// ==========================================
// GENERATE VIDEO + SCENE PLAN
// ==========================================

const generateVideo = async (req, res) => {
  let existingVideo = null;

  try {
    const { lessonId } = req.body;

    // ==========================================
    // VALIDATE LESSON ID
    // ==========================================

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId is required",
      });
    }

    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lessonId",
      });
    }

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ==========================================
    // FIND LESSON
    // ==========================================

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
    // CHECK EXISTING VIDEO FIRST
    // ==========================================

    existingVideo = await TeachingVideo.findOne({
      lessonId: lesson._id,
      userId,
    });

    // ==========================================
    // ALREADY PROCESSING
    // ==========================================

    if (
      existingVideo &&
      existingVideo.status === "processing"
    ) {
      return res.status(200).json({
        success: true,
        message: "Teaching video is already being generated",
        video: existingVideo,
      });
    }

    // ==========================================
    // ALREADY COMPLETED
    // ==========================================

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

    // ==========================================
    // GENERATE EDUCATIONAL SCENE PLAN
    // ==========================================

    console.log(
      `Generating teaching scene plan for lesson ${lesson._id}...`
    );

    const videoPlan = await generateLessonScenePlan({
      topic:
        lesson.title ||
        lesson.topic ||
        "AI Teacher Lesson",

      level:
        lesson.level ||
        "beginner",

      language:
        lesson.language ||
        "English",

      introduction:
        lesson.introduction ||
        "",

      explanation:
        lesson.explanation ||
        "",

      examples:
        Array.isArray(lesson.examples)
          ? lesson.examples
          : [],

      demonstration:
        lesson.demonstration ||
        "",

      summary:
        lesson.summary ||
        "",
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
        message: "No teaching scenes were generated",
      });
    }

    // ==========================================
    // VALIDATE SCENES
    // ==========================================

    const validScenes = videoPlan.scenes.filter(
      (scene) =>
        scene &&
        typeof scene === "object" &&
        typeof scene.script === "string" &&
        scene.script.trim().length > 0
    );

    if (validScenes.length === 0) {
      return res.status(500).json({
        success: false,
        message:
          "Generated scenes do not contain any teaching script",
      });
    }

    // ==========================================
    // COMBINE SCENE SCRIPTS
    // ==========================================

    const script = validScenes
      .map((scene) => scene.script.trim())
      .join("\n\n");

    if (!script) {
      return res.status(500).json({
        success: false,
        message: "Teaching script is empty",
      });
    }

    // ==========================================
    // CREATE / RESET DATABASE RECORD
    // ==========================================

    if (!existingVideo) {
      try {
        existingVideo = await TeachingVideo.create({
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

          scenes: validScenes,

          videoUrl: null,

          duration: null,

          error: null,
        });
      } catch (error) {
        // Mongo duplicate-key protection for concurrent requests
        if (error?.code === 11000) {
          existingVideo =
            await TeachingVideo.findOne({
              lessonId: lesson._id,
              userId,
            });

          if (
            existingVideo &&
            existingVideo.status === "processing"
          ) {
            return res.status(200).json({
              success: true,
              message:
                "Teaching video is already being generated",
              video: existingVideo,
            });
          }

          throw error;
        }

        throw error;
      }
    } else {
      // Reset failed video for retry

      existingVideo.title =
        videoPlan.title ||
        lesson.title ||
        lesson.topic ||
        "AI Teacher Lesson";

      existingVideo.scenes = validScenes;

      existingVideo.status = "processing";

      existingVideo.provider = "";

      existingVideo.providerVideoId = "";

      existingVideo.videoUrl = null;

      existingVideo.duration = null;

      existingVideo.error = null;

      await existingVideo.save();
    }

    // ==========================================
    // GENERATE AVATAR VIDEO
    // ==========================================

    console.log(
      `Sending teaching script to avatar provider for lesson ${lesson._id}...`
    );

    let avatarVideo;

    try {
      avatarVideo = await generateAvatarVideo({
        title:
          videoPlan.title ||
          lesson.title ||
          lesson.topic ||
          "AI Teacher Lesson",

        script,
      });
    } catch (avatarError) {
      console.error(
        "Avatar generation error:",
        getErrorMessage(avatarError)
      );

      // IMPORTANT:
      // Don't leave the DB record permanently stuck
      existingVideo.status = "failed";
      existingVideo.error = getErrorMessage(avatarError);
      await existingVideo.save();

      const status = getErrorStatus(avatarError);

      if (status === 429) {
        return res.status(429).json({
          success: false,
          message:
            "Video generation quota exceeded. Please try again later.",
        });
      }

      if (status === 503) {
        return res.status(503).json({
          success: false,
          message:
            "Video generation service is temporarily unavailable.",
        });
      }

      return res.status(502).json({
        success: false,
        message:
          "Avatar video generation failed. Please try again.",
        video: existingVideo,
      });
    }

    // ==========================================
    // VALIDATE AVATAR RESULT
    // ==========================================

    if (
      !avatarVideo ||
      !avatarVideo.providerVideoId
    ) {
      existingVideo.status = "failed";
      existingVideo.error =
        "Avatar provider did not return a video ID.";

      await existingVideo.save();

      return res.status(502).json({
        success: false,
        message:
          "Video provider did not return a valid video ID.",
        video: existingVideo,
      });
    }

    // ==========================================
    // SAVE PROVIDER RESULT
    // ==========================================

    existingVideo.provider =
      avatarVideo.provider ||
      "synthesia";

    existingVideo.providerVideoId =
      avatarVideo.providerVideoId;

    const providerStatus =
      avatarVideo.status || "processing";

    existingVideo.status =
      ALLOWED_VIDEO_STATUSES.includes(providerStatus)
        ? providerStatus
        : "processing";

    existingVideo.videoUrl =
      avatarVideo.videoUrl || null;

    if (avatarVideo.duration != null) {
      existingVideo.duration =
        avatarVideo.duration;
    }

    existingVideo.error = null;

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

      scenes: validScenes,
    };

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(202).json({
      success: true,

      message:
        "AI Teacher video generation started",

      videoPlan: finalVideoPlan,

      video: existingVideo,
    });

  } catch (error) {
    console.error(
      "Generate video error:",
      getErrorMessage(error)
    );

    const status = getErrorStatus(error);

    // ==========================================
    // GEMINI RATE LIMIT
    // ==========================================

    if (status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "AI service quota exceeded. Please try again later.",
      });
    }

    // ==========================================
    // SERVICE UNAVAILABLE
    // ==========================================

    if (status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "AI service is temporarily unavailable. Please try again.",
      });
    }

    // ==========================================
    // GENERAL ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate AI teacher video",

      ...(process.env.NODE_ENV === "development"
        ? {
            error: getErrorMessage(error),
          }
        : {}),
    });
  }
};


// ==========================================
// GET VIDEO STATUS
// ==========================================

const getVideoStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ==========================================
    // FIND VIDEO
    // ==========================================

    const video = await TeachingVideo.findOne({
      _id: id,
      userId,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Teaching video not found",
      });
    }

    // ==========================================
    // COMPLETED
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
    // FAILED
    // ==========================================

    if (video.status === "failed") {
      return res.status(200).json({
        success: true,
        video,
      });
    }

    // ==========================================
    // CHECK AVATAR PROVIDER
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

      // ==========================================
      // UPDATE STATUS
      // ==========================================

      if (
        result?.status &&
        ALLOWED_VIDEO_STATUSES.includes(
          result.status
        )
      ) {
        video.status = result.status;
      }

      // ==========================================
      // UPDATE VIDEO URL
      // ==========================================

      if (result?.videoUrl) {
        video.videoUrl =
          result.videoUrl;
      }

      // ==========================================
      // UPDATE DURATION
      // ==========================================

      if (result?.duration != null) {
        video.duration =
          result.duration;
      }

      // ==========================================
      // UPDATE ERROR
      // ==========================================

      if (result?.error) {
        video.error =
          String(result.error);

        video.status = "failed";
      }

      // ==========================================
      // SAFETY CHECK
      // ==========================================

      if (
        video.status === "completed" &&
        !video.videoUrl
      ) {
        video.status = "processing";
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
      getErrorMessage(error)
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get video status",

      ...(process.env.NODE_ENV === "development"
        ? {
            error: getErrorMessage(error),
          }
        : {}),
    });
  }
};


// ==========================================
// GET VIDEO FOR LESSON
// ==========================================

const getLessonVideo = async (req, res) => {
  try {
    const { lessonId } = req.params;

    // ==========================================
    // VALIDATE LESSON ID
    // ==========================================

    if (
      !lessonId ||
      !isValidObjectId(lessonId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    // ==========================================
    // FIND VIDEO
    // ==========================================

    const video =
      await TeachingVideo.findOne({
        lessonId,
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
      getErrorMessage(error)
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