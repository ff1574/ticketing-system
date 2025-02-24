const express = require("express");
const {
  registerCustomer,
  loginUser,
} = require("../Controllers/authController");
const router = express.Router();

router.post("/register", registerCustomer);
router.post("/login", loginUser);

module.exports = router;
