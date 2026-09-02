const mongoose = require("mongoose");

const teachingVideoSchema = new mongoose.Schema(
  {
    // ==========================================
    // OWNER
    // ==========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // LESSON
    // ==========================================

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },

    // ==========================================
    // VIDEO INFORMATION
    // ==========================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    // ==========================================
    // GENERATED VIDEO
    // ==========================================

    videoUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    thumbnailUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================
    // SCENE PLAN
    //
    // Kept as Mixed until we verify the exact
    // scene structure from lessonSceneService.
    // ==========================================

    scenes: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // ==========================================
    // VIDEO PROVIDER
    // ==========================================

    provider: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    providerVideoId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },

  {
    timestamps: true,
  }
);


// ==========================================
// IMPORTANT: ONE VIDEO PER USER + LESSON
// ==========================================

teachingVideoSchema.index(
  {
    userId: 1,
    lessonId: 1,
  },
  {
    unique: true,
  }
);


// ==========================================
// STATUS QUERY
// ==========================================

teachingVideoSchema.index({
  userId: 1,
  status: 1,
});


// ==========================================
// FUTURE WEBHOOK LOOKUP
// ==========================================

teachingVideoSchema.index({
  provider: 1,
  providerVideoId: 1,
});


module.exports = mongoose.model(
  "TeachingVideo",
  teachingVideoSchema
);