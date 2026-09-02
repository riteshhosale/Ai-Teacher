const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
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

    topic: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    strongConcepts: {
      type: [String],
      default: [],
    },

    weakConcepts: {
      type: [String],
      default: [],
    },

    misconceptions: {
      type: [String],
      default: [],
    },

    revision: {
      type: String,
      default: "",
    },

    practice: {
      type: String,
      default: "",
    },

    nextTopic: {
      type: String,
      default: "",
    },

    questionResults: {
      type: [
        {
          question: String,
          studentAnswer: String,
          expectedAnswer: String,
          score: Number,
          correct: Boolean,
          misconception: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Assessment",
  assessmentSchema
);