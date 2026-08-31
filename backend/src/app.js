const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const materialRoutes = require("./routes/materialRoutes");
const adaptiveRoutes = require("./routes/adaptiveRoutes");
const progressRoutes = require("./routes/progressRoutes");

const app = express();

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",

  // Your Vercel frontend URL
  process.env.CLIENT_URL,

  // Optional alternative variable
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log("Allowed CORS origins:");
console.log(allowedOrigins);

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman / server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(
        "CORS blocked origin:",
        origin
      );

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json()
);

// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Welcome to the AI Hackathon Project API",
  });
});

// =====================================================
// AUTH
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

// =====================================================
// LESSON
// =====================================================

app.use(
  "/api/lesson",
  lessonRoutes
);

// =====================================================
// MATERIAL
// =====================================================

app.use(
  "/api/material",
  materialRoutes
);

// =====================================================
// ADAPTIVE
// =====================================================

app.use(
  "/api/adaptive",
  adaptiveRoutes
);

// =====================================================
// PROGRESS
// =====================================================

app.use(
  "/api/progress",
  progressRoutes
);

// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "================================"
    );

    console.error(
      "SERVER ERROR:"
    );

    console.error(
      err.message
    );

    console.error(
      "================================"
    );

    // CORS error
    if (
      err.message &&
      err.message.startsWith(
        "CORS blocked"
      )
    ) {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Server error",

      error:
        process.env.NODE_ENV ===
        "development"
          ? err.stack
          : undefined,
    });
  }
);

module.exports = app;