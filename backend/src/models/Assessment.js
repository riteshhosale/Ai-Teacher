const mongoose = require("mongoose");

const questionResultSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    studentAnswer: {
      type: String,
      default: "",
      trim: true,
    },

    expectedAnswer: {
      type: String,
      required: true,
      trim: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    correct: {
      type: Boolean,
      required: true,
    },

    misconception: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);


const assessmentSchema = new mongoose.Schema(
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
    // LESSON
    // ==========================================

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },

    // ==========================================
    // TOPIC SNAPSHOT
    // ==========================================

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // SCORE
    // Percentage: 0 - 100
    // ==========================================

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // ==========================================
    // SCORE DETAILS
    // ==========================================

    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // AI ANALYSIS
    // ==========================================

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
      trim: true,
    },

    practice: {
      type: String,
      default: "",
      trim: true,
    },

    nextTopic: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // QUESTION RESULTS
    // ==========================================

    questionResults: {
      type: [questionResultSchema],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);


// ==========================================
// INDEXES
// ==========================================

// If only ONE assessment is allowed per lesson:
// assessmentSchema.index(
//   { userId: 1, lessonId: 1 },
//   { unique: true }
// );


// Useful for user's assessment history
assessmentSchema.index({
  userId: 1,
  createdAt: -1,
});


module.exports = mongoose.model(
  "Assessment",
  assessmentSchema
);