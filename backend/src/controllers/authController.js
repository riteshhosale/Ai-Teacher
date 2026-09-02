const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =====================================================
// CONFIGURATION
// =====================================================

const getJWTSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  if (jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long"
    );
  }

  return jwtSecret;
};

// =====================================================
// HELPERS
// =====================================================

const cleanString = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeEmail = (email) => {
  return cleanString(email).toLowerCase();
};

const isValidEmail = (email) => {
  // Practical validation.
  // The User schema should ALSO have validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

// =====================================================
// GENERATE JWT
// =====================================================

const generateToken = (userId) => {
  const jwtSecret = getJWTSecret();

  return jwt.sign(
    {
      userId: String(userId),
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
    const body = req.body || {};

    const name = cleanString(body.name);
    const email = normalizeEmail(body.email);
    const password =
      typeof body.password === "string"
        ? body.password
        : "";
    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and confirmPassword are required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters long",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Name must not exceed 100 characters",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (email.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Email address is too long",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message:
          "Password must not exceed 128 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // -------------------------------------------------
    // CHECK EXISTING USER
    // -------------------------------------------------

    const existingUser =
      await User.findOne({
        email,
      }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User with this email already exists",
      });
    }

    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 12);

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------

    let user;

    try {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
      });
    } catch (error) {
      // MongoDB duplicate-key protection.
      // This protects against a race condition where
      // another request creates the same email between
      // findOne() and create().

      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "User with this email already exists",
        });
      }

      throw error;
    }

    // -------------------------------------------------
    // GENERATE TOKEN
    // -------------------------------------------------

    const token = generateToken(user._id);

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

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
      error?.message
    );

    return res.status(500).json({
      success: false,

      message:
        process.env.NODE_ENV === "development"
          ? error?.message
          : "Server error",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const body = req.body || {};

    const email = normalizeEmail(body.email);

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide email and password",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user =
      await User.findOne({
        email,
      });

    // Do not reveal whether the email exists.
    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // -------------------------------------------------
    // CHECK PASSWORD
    // -------------------------------------------------

    if (
      typeof user.password !== "string" ||
      !user.password
    ) {
      console.error(
        `LOGIN ERROR: User ${user._id} has no password`
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
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

    // -------------------------------------------------
    // GENERATE TOKEN
    // -------------------------------------------------

    const token =
      generateToken(user._id);

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

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
      error?.message
    );

    return res.status(500).json({
      success: false,

      message:
        process.env.NODE_ENV === "development"
          ? error?.message
          : "Server error",
    });
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================

const getMe = async (req, res) => {
  try {
    const rawUserId =
      req.user?.userId ??
      req.user?._id ??
      req.user?.id;

    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found in authentication token",
      });
    }

    const userId = String(rawUserId);

    // -------------------------------------------------
    // VALIDATE USER ID
    // -------------------------------------------------

    if (!require("mongoose").Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication user ID",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user =
      await User.findById(userId)
        .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

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
      error?.message
    );

    return res.status(500).json({
      success: false,

      message:
        process.env.NODE_ENV === "development"
          ? error?.message
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