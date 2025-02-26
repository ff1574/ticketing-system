const express = require("express");
const {
  getAllOpenTickets,
  submitTicket,
  assignTicketToAgent,
  declineTicket,
} = require("../Controllers/ticketController");
const router = express.Router();

router.get("/ticket/getAllOpenTickets", getAllOpenTickets);

router.post("/ticket/submit", submitTicket);

router.put("/ticket/assignTicketToAgent/:ticketId", assignTicketToAgent);
router.put("/ticket/declineTicket/:ticketId", declineTicket);

module.exports = router;
