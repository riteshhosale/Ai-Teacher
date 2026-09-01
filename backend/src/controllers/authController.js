const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =====================================================
// GENERATE JWT
// =====================================================

const generateToken = (userId) => {
  const jwtSecret =
    process.env.JWT_SECRET ||
    process.env.jwt_secret;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  return jwt.sign(
    {
      userId: userId.toString(),
    },
    jwtSecret,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });

    const token =
      generateToken(user._id);

    return res.status(201).json({
      success: true,

      message:
        "User registered successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : "Server error",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide email and password",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // -----------------------------------------------
    // FIND USER
    // -----------------------------------------------

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // -----------------------------------------------
    // CHECK PASSWORD
    // -----------------------------------------------

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message:
          "User password is not configured",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // -----------------------------------------------
    // GENERATE TOKEN
    // -----------------------------------------------

    const token =
      generateToken(user._id);

    console.log(
      "Login successful:",
      user.email
    );

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "User logged in successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : "Server error",
    });
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================

const getMe = async (req, res) => {
  try {

    const userId =
      req.user?.userId ||
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found in token",
      });
    }

    const user =
      await User.findById(
        userId
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    console.error(
      "GET ME ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : "Server error",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  register,
  login,
  getMe,
};
