const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC USER INFORMATION
    // ==========================================

    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name must be less than 50 characters long"],
      match: [
        /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/,
        "Name contains invalid characters",
      ],
    },

    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [
        8,
        "Password must be at least 8 characters long",
      ],
    },

    // ==========================================
    // LEARNING PROFILE
    // ==========================================

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
      maxlength: 5000,
    },

    learningGoal: {
      type: String,
      default: "Understand the topic",
      trim: true,
      maxlength: 500,
    },

    teachingStyle: {
      type: String,
      default: "Simple and example-based",
      trim: true,
      maxlength: 200,
    },

    language: {
      type: String,
      default: "English",
      trim: true,
      maxlength: 50,
    },

    availableTime: {
      type: Number,
      default: 30,
      min: [
        5,
        "Available time must be at least 5 minutes",
      ],
      max: [
        1440,
        "Available time cannot exceed 1440 minutes",
      ],
    },

    // ==========================================
    // LEARNING PERFORMANCE
    // ==========================================

    weakConcepts: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= 50 &&
          items.every(
            (item) =>
              typeof item === "string" &&
              item.trim().length > 0 &&
              item.length <= 300
          ),
        message: "Invalid weakConcepts list",
      },
    },

    strongConcepts: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= 50 &&
          items.every(
            (item) =>
              typeof item === "string" &&
              item.trim().length > 0 &&
              item.length <= 300
          ),
        message: "Invalid strongConcepts list",
      },
    },

    misconceptions: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= 50 &&
          items.every(
            (item) =>
              typeof item === "string" &&
              item.trim().length > 0 &&
              item.length <= 500
          ),
        message: "Invalid misconceptions list",
      },
    },

    previousScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // ==========================================
    // LEARNING STATISTICS
    // These should be updated by backend logic.
    // ==========================================

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

    // ==========================================
    // CURRENT LEARNING PATH
    // ==========================================

    currentTopic: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
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

module.exports = mongoose.model("User", userSchema);