require("dotenv").config();

const express = require("express");
const cors = require("cors");

// =========================
// ROUTES
// =========================

const authRoutes = require("./routes/authRoutes");

const materialRoutes = require("./routes/materialRoutes");

const lessonRoutes = require("./routes/lessonRoutes");

const adaptiveRoutes = require("./routes/adaptiveRoutes");

const progressRoutes = require("./routes/progressRoutes");

const lessonHistoryRoutes = require("./routes/lessonHistoryRoutes");

const recommendationRoutes = require("./routes/recommendationRoutes");

const documentRoutes = require("./routes/documentRoutes");

const ragRoutes = require("./routes/ragRoutes");

const speechRoutes = require("./routes/speechRoutes");

const realtimeRoutes = require("./routes/realtimeRoutes");

const videoRoutes = require("./routes/videoRoutes");

const assessmentRoutes = require("./routes/assessmentRoutes");

// =========================
// APP
// =========================

const app = express();

// =========================
// CORS
// =========================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://ai-teacher-seven-jade.vercel.app",
];

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /^https:\/\/.*\.vercel\.app$/.test(origin);
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin
      // such as Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// =========================
// BODY PARSER
// =========================

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Teacher API is running",
  });
});

// =========================
// API ROUTES
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/material", materialRoutes);

app.use("/api/lesson", lessonRoutes);

app.use("/api/adaptive", adaptiveRoutes);

app.use("/api/progress", progressRoutes);

app.use("/api/lessons", lessonHistoryRoutes);

app.use("/api/recommendations", recommendationRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/rag", ragRoutes);

app.use("/api/speech", speechRoutes);

app.use("/api/realtime", realtimeRoutes);

app.use("/api/video", videoRoutes);

app.use("/api/assessment", assessmentRoutes);

// =========================
// 404
// =========================

app.use((req, res) => {
  console.log("404 Route:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =========================
// ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error("================================");

  console.error("SERVER ERROR:");

  console.error(err.message);

  console.error("================================");

  // CORS error
  if (err.message?.startsWith("CORS blocked origin")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// =========================
// EXPORT
// =========================

module.exports = app;
