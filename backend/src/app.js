const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const materialRoutes = require("./routes/materialRoutes");
const adaptiveRoutes = require("./routes/adaptiveRoutes");
const progressRoutes = require("./routes/progressRoutes");

// =====================================================
// CREATE EXPRESS APP FIRST
// =====================================================

const app = express();

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // Your Vercel frontend
  "https://ai-teacher-seven-jade.vercel.app",

  // Render environment variables
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log(
  "Allowed CORS origins:",
  allowedOrigins
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin
      // e.g. Postman / curl
      if (!origin) {
        return callback(null, true);
      }

      // Exact origins
      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      console.error(
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
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Welcome to the AI Hackathon Project API",
  });
});

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "AI Teacher backend is running",
    });
  }
);

// =====================================================
// ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/lesson",
  lessonRoutes
);

app.use(
  "/api/material",
  materialRoutes
);

app.use(
  "/api/adaptive",
  adaptiveRoutes
);

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
      path: req.originalUrl,
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
      err.message?.startsWith(
        "CORS blocked"
      )
    ) {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Server error",
    });
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = app;