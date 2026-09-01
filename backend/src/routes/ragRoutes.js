const express = require("express");

const {
  askFromMaterial,
} = require("../controllers/ragController");

const { protect } = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.post(
  "/ask",
  protect,
  askFromMaterial
);

module.exports = router;