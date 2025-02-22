const express = require("express");
const {
  getCustomerDetails,
  updateCustomerDetails,
} = require("../Controllers/customerController");
const router = express.Router();

router.get("/customer/:id", getCustomerDetails);
router.put("/customer/:id", updateCustomerDetails);

module.exports = router;
