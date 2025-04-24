const express = require("express");
const {
  getAllOpenTickets,
  getTicketById,
  submitTicket,
  getReservedTickets,
  releaseReservation,
  heartbeatReservation,
  assignTicketToAgent,
  declineTicket,
  getCustomerTickets,
  getAdminTickets,
  getTicketMessages,
  sendTicketMessage,
} = require("../Controllers/ticketController");
const router = express.Router();

router.get("/ticket/getAllOpenTickets", getAllOpenTickets);
router.get("/ticket/:ticketId", getTicketById);
router.get("/ticket/:ticketId/messages", getTicketMessages);

router.post("/ticket/submit", submitTicket);
router.post("/ticket/reserve", getReservedTickets);
router.post("/ticket/release", releaseReservation);
router.post("/ticket/heartbeat", heartbeatReservation);
router.post("/ticket/getCustomerTickets", getCustomerTickets);
router.post("/ticket/getAdminTickets", getAdminTickets);
router.post("/ticket/:ticketId/message", sendTicketMessage);

router.put("/ticket/assignTicketToAgent/:ticketId", assignTicketToAgent);
router.put("/ticket/declineTicket/:ticketId", declineTicket);

module.exports = router;
