const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
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
    // STORED FILE NAME
    // ==========================================

    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // ==========================================
    // ORIGINAL USER FILE NAME
    // ==========================================

    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // ==========================================
    // PDF INFORMATION
    // ==========================================

    pages: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalChunks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  {
    timestamps: true,
  }
);


// ==========================================
// INDEXES
// ==========================================

documentSchema.index({
  userId: 1,
  createdAt: -1,
});


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
  "Document",
  documentSchema
);