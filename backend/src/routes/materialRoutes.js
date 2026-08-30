const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadMaterial,
} = require("../controllers/materialController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ================= UPLOAD DIRECTORY =================

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================= MULTER STORAGE =================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// ================= UPLOAD CONFIG =================

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    console.log("Original name:", file.originalname);
    console.log("MIME type:", file.mimetype);

    const isPdfMime =
      file.mimetype === "application/pdf";

    const isPdfExtension =
      path.extname(file.originalname).toLowerCase() === ".pdf";

    if (isPdfMime || isPdfExtension) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ================= ROUTE =================

router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadMaterial
);

module.exports = router;