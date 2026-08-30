const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const lessonRoutes = require("./routes/lessonRoutes");

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

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: "Server error",
    });
});

module.exports = app;