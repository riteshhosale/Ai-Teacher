require("dotenv").config();

const express = require("express");
const cors = require("cors");

const chromaService = require("./services/chromaService");

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
// CHROMA READINESS
// =========================

let chromaReady = false;

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

  // Allow Vercel preview deployments
  return /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin
      // such as Postman/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);

      return callback(new Error("CORS origin not allowed"));
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

// =========================
// BODY PARSER
// =========================

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// =========================
// INITIALIZE CHROMA
// =========================

const initializeChroma = async () => {
  try {
    await chromaService.initializeCollection();

    chromaReady = true;

    console.log("Chroma Cloud initialized successfully");
  } catch (error) {
    chromaReady = false;

    console.error(
      "Failed to initialize Chroma:",
      error.message
    );

    // Do not crash the entire API.
    // Non-RAG APIs can continue working.
  }
};

// Start initialization without blocking
// Express route registration.
initializeChroma();

// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Teacher API is running",
  });
});

app.get("/api/health", (req, res) => {
  const healthy = chromaReady;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "healthy" : "degraded",
    services: {
      api: "up",
      chroma: chromaReady ? "up" : "unavailable",
    },
    timestamp: new Date().toISOString(),
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
  console.warn(
    "404 Route:",
    req.method,
    req.originalUrl
  );

  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// =========================
// ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error("================================");
  console.error("SERVER ERROR:");
  console.error(err);
  console.error("================================");

  // CORS error
  if (err.message === "CORS origin not allowed") {
    return res.status(403).json({
      success: false,
      message: "CORS origin not allowed",
    });
  }

  // JSON body too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// =========================
// EXPORT
// =========================

module.exports = app;