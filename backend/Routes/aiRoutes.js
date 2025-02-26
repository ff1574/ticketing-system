const express = require("express");
const { askAI, assessTicket } = require("../Controllers/aiController");

const router = express.Router();

router.post("/ask-ai", askAI);

module.exports = router;
