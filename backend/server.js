require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // =========================
    // ENVIRONMENT VALIDATION
    // =========================

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    // =========================
    // ENVIRONMENT STATUS
    // =========================

    console.log("JWT_SECRET: Loaded");
    console.log("GEMINI_API_KEY: Loaded");

    // =========================
    // DATABASE
    // =========================

    await connectDB();

    console.log("MongoDB connected successfully");

    // =========================
    // SERVER
    // =========================

    const server = app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `Server is running on port ${PORT}`
        );
      }
    );

    // =========================
    // GRACEFUL SHUTDOWN
    // =========================

    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down...`);

      server.close(() => {
        console.log("HTTP server closed");

        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // =========================
    // UNHANDLED ERRORS
    // =========================

    process.on("unhandledRejection", (reason) => {
      console.error(
        "Unhandled promise rejection:",
        reason
      );

      shutdown("unhandledRejection");
    });

    process.on("uncaughtException", (error) => {
      console.error(
        "Uncaught exception:",
        error
      );

      shutdown("uncaughtException");
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};

startServer();