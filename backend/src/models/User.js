const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC USER INFORMATION
    // =========================

    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name must be less than 50 characters long"],
      match: [
        /^[a-zA-Z\s]+$/,
        "Name can only contain letters and spaces",
      ],
    },

    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters long"],
    },

    // =========================
    // LEARNING PROFILE
    // =========================

    level: {
      type: String,
      enum: [
        "beginner",
        "intermediate",
        "advanced",
      ],
      default: "beginner",
    },

    existingKnowledge: {
      type: String,
      default: "",
      trim: true,
    },

    learningGoal: {
      type: String,
      default: "Understand the topic",
      trim: true,
    },

    teachingStyle: {
      type: String,
      default: "Simple and example-based",
      trim: true,
    },

    language: {
      type: String,
      default: "English",
      trim: true,
    },

    availableTime: {
      type: Number,
      default: 30,
      min: [5, "Available time must be at least 5 minutes"],
    },

    // =========================
    // LEARNING PERFORMANCE
    // =========================

    weakConcepts: {
      type: [String],
      default: [],
    },

    strongConcepts: {
      type: [String],
      default: [],
    },

    misconceptions: {
      type: [String],
      default: [],
    },

    previousScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // =========================
    // LEARNING STATISTICS
    // =========================

    completedLessons: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // =========================
    // CURRENT LEARNING PATH
    // =========================

    currentTopic: {
      type: String,
      default: "",
      trim: true,
    },

    nextTopic: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);