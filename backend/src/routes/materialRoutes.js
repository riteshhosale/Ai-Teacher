const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const {
  uploadMaterial,
} = require("../controllers/materialController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ================= UPLOAD DIRECTORY =================

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ================= MULTER STORAGE =================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName = `${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  },
});

// ================= UPLOAD CONFIG =================

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const originalName =
      typeof file.originalname === "string"
        ? file.originalname
        : "";

    const extension =
      path.extname(originalName).toLowerCase();

    const isPdfMime =
      file.mimetype === "application/pdf";

    const isPdfExtension =
      extension === ".pdf";

    if (isPdfMime && isPdfExtension) {
      return cb(null, true);
    }

    return cb(
      new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file")
    );
  },

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});

// ================= UPLOAD MIDDLEWARE =================

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "PDF file must be 10 MB or smaller",
        });
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Only one PDF file is allowed",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid file upload",
      });
    }

    console.error("Upload error:", error.message);

    return res.status(400).json({
      success: false,
      message: "File upload failed",
    });
  });
};

// ================= ROUTE =================

router.post(
  "/upload",
  protect,
  handleUpload,
  uploadMaterial
);

module.exports = router;