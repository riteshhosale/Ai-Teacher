const mongoose = require("mongoose");


// ==========================================
// QUESTION SCHEMA
// ==========================================

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) =>
          Array.isArray(options) &&
          options.length === 4 &&
          options.every(
            (option) =>
              typeof option === "string" &&
              option.trim().length > 0
          ),

        message:
          "Each question must contain exactly 4 valid options",
      },
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    // ==========================================
    // USER ANSWER
    // ==========================================

    userAnswer: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // IMPORTANT:
    // Backend calculates this.
    // Never trust frontend value.
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);


// ==========================================
// LESSON SCHEMA
// ==========================================

const lessonSchema = new mongoose.Schema(
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
    // SOURCE DOCUMENT
    // MongoDB metadata reference only.
    // RAG chunks remain in Chroma.
    // ==========================================

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
      index: true,
    },

    // ==========================================
    // LESSON INFORMATION
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

    estimatedTime: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    // ==========================================
    // LESSON CONTENT
    // ==========================================

    introduction: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 15000,
    },

    examples: {
      type: [String],
      default: [],
      validate: {
        validator: (examples) =>
          Array.isArray(examples) &&
          examples.every(
            (example) =>
              typeof example === "string" &&
              example.trim().length > 0
          ),

        message: "Examples must contain valid strings",
      },
    },

    demonstration: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000,
    },

    // ==========================================
    // QUESTIONS
    // ==========================================

    questions: {
      type: [questionSchema],
      default: [],
    },

    // ==========================================
    // SUMMARY
    // ==========================================

    summary: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    // ==========================================
    // NEXT TOPIC
    // ==========================================

    nextTopic: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    // ==========================================
    // SCORE
    //
    // score = number of correct answers
    // NOT percentage
    // ==========================================

    score: {
      type: Number,
      default: 0,
      min: 0,
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
  },
  {
    timestamps: true,
  }
);


// ==========================================
// INDEXES
// ==========================================

lessonSchema.index({
  userId: 1,
  createdAt: -1,
});

lessonSchema.index({
  userId: 1,
  documentId: 1,
});


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
  "Lesson",
  lessonSchema
);