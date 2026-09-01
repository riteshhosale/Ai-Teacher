const express = require("express");

const {
  getDocuments,
} = require("../controllers/documentController");

const { protect } = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.get(
  "/",
  protect,
  getDocuments
);

module.exports = router;