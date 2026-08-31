const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const materialRoutes = require("./routes/materialRoutes");
const adaptiveRoutes = require("./routes/adaptiveRoutes");
const progressRoutes =
  require("./routes/progressRoutes");

const app = express();

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to the AI Hackathon Project API",
    });
});

//auth routes
app.use("/api/auth", authRoutes);
app.use("/api/lesson", lessonRoutes);
app.use("/api/material", materialRoutes);
app.use(
  "/api/adaptive",
  adaptiveRoutes
);
app.use(
  "/api/progress",
  progressRoutes
);

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use((err, req, res, next) => {
  console.error("================================");
  console.error("UPLOAD ERROR:");
  console.error(err);
  console.error("================================");

  res.status(500).json({
    success: false,
    message: err.message || "Server error",
    error: process.env.NODE_ENV === "development"
      ? err.stack
      : undefined,
  });
});

module.exports = app;