
const mongoose = require("mongoose");

const learningProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    weakTopics: {
      type: [String],
      default: [],
    },

    nextTopic: {
      type: String,
      default: "",
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LearningProgress",
  learningProgressSchema
);