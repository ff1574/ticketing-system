const express = require("express");
const { askAI } = require("../Controllers/aiController");

const router = express.Router();

// Route for asking the AI
router.post("/ask-ai", askAI);

module.exports = router;
