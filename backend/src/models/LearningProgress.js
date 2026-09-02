const mongoose = require("mongoose");

const learningProgressSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // LEARNING INFORMATION
    // ==========================================

    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    level: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    language: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // ==========================================
    // SCORE
    // score = number of correct answers
    // ==========================================

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Calculated by backend
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ==========================================
    // COMPLETION
    // ==========================================

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // AI LEARNING ANALYSIS
    // ==========================================

    weakTopics: {
      type: [String],
      default: [],
    },

    nextTopic: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// INDEXES
// ==========================================

learningProgressSchema.index({
  userId: 1,
  createdAt: -1,
});


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
  "LearningProgress",
  learningProgressSchema
);