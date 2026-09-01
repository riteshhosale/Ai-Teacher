require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET ||
  process.env.jwt_secret
    ? "Loaded"
    : "Missing"
);

console.log(
  "GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY
    ? "Loaded"
    : "Missing"
);

connectDB();

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server is running on port ${PORT}`
    );
  }
);
