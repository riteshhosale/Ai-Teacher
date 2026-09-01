const mongoose = require("mongoose");

const teachingVideoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    title: {
      type: String,
      required: true,
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
    },

    videoUrl: {
      type: String,
      default: "",
    },

    thumbnailUrl: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      default: 0,
    },

    scenes: {
      type: Array,
      default: [],
    },

    provider: {
      type: String,
      default: "",
    },

    providerVideoId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "TeachingVideo",
    teachingVideoSchema
  );