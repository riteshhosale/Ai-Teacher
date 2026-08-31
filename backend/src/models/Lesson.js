const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      required: true,
    },

    correctAnswer: {
      type: String,
      required: true,
    },

    explanation: {
      type: String,
      default: "",
    },

    userAnswer: {
      type: String,
      default: "",
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const lessonSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
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

    estimatedTime: {
      type: String,
      default: "",
    },

    introduction: {
      type: String,
      default: "",
    },

    explanation: {
      type: String,
      default: "",
    },

    examples: {
      type: [String],
      default: [],
    },

    demonstration: {
      type: String,
      default: "",
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    summary: {
      type: String,
      default: "",
    },

    nextTopic: {
      type: String,
      default: "",
    },

    score: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Lesson",
  lessonSchema
);