const db = require("../Util/db");
const { assessTicket } = require("./aiController");

exports.submitTicket = async (req, res) => {
  try {
    const { customerId, title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    // Call assessTicket with the ticket data directly
    const assessment = await assessTicket({ title, description });

    const [result] = await db.execute(
      `INSERT INTO ticket (
          customer_id, 
          ticket_title, 
          ticket_description,
          ticket_urgency,
          ticket_impact,
          ticket_priority,
          ticket_exp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        title,
        description,
        assessment.urgency,
        assessment.impact,
        assessment.priority,
        assessment.baseExp,
      ]
    );

    res.status(201).json({
      message: "Ticket created successfully",
      ticketId: result.insertId,
      ...assessment,
    });
  } catch (error) {
    console.error("Ticket Submission Error:", error);
    const statusCode = error.message.includes("AI Assessment") ? 502 : 500;
    res.status(statusCode).json({
      message: error.message || "Failed to create ticket",
    });
  }
};

exports.getAllOpenTickets = async (req, res) => {
  try {
    const [tickets] = await db.execute(`
        SELECT 
          t.ticket_id AS ticketId,
          t.ticket_title AS title,
          t.ticket_description AS description,
          t.ticket_priority AS priority,
          t.ticket_exp AS xp,
          t.created_at AS timestamp,
          c.customer_name AS username,
          t.ticket_status AS status
        FROM ticket t
        JOIN customer c ON t.customer_id = c.customer_id
        WHERE t.ticket_status = 'open'
        ORDER BY 
          FIELD(t.ticket_priority, 'high', 'medium', 'low'),
          t.ticket_exp DESC,
          t.created_at ASC
      `);

    res.json(
      tickets.map((ticket) => ({
        ...ticket,
        ticketId: ticket.ticketId,
        timestamp: new Date(ticket.timestamp).toISOString(),
        ticketDescription: ticket.description,
        xp: ticket.xp,
      }))
    );
  } catch (error) {
    console.error("Get Tickets Error:", error);
    res.status(500).json({
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

exports.assignTicketToAgent = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const { administratorId } = req.body;

    const [result] = await db.execute(
      `UPDATE ticket 
         SET 
           administrator_id = ?,
           ticket_status = "pending"
         WHERE ticket_id = ?`,
      [administratorId, ticketId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Ticket not assigned properly" });
    }

    res.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Failed to assign ticket" });
  }
};

exports.declineTicket = async (req, res) => {
  const { ticketId } = req.params;
  const administratorId = req.body.administratorId;

  try {
    // Record the decline
    await db.execute(
      `INSERT INTO ticket_decline_history 
         (ticket_id, administrator_id)
         VALUES (?, ?)`,
      [ticketId, administratorId]
    );

    // Check if this is first decline by this agent
    const [existing] = await db.execute(
      `SELECT 1 FROM ticket_decline_history 
         WHERE ticket_id = ? AND administrator_id = ?
         LIMIT 1`,
      [ticketId, administratorId]
    );

    let xpToAdd = 0;
    if (existing.length === 0) {
      // First decline by this agent - update unique count and XP
      const [ticket] = await db.execute(
        `SELECT unique_decline_count 
           FROM ticket 
           WHERE ticket_id = ?`,
        [ticketId]
      );

      const newUniqueCount = ticket[0].unique_decline_count + 1;
      xpToAdd = this.calculateXP(newUniqueCount);

      await db.execute(
        `UPDATE ticket 
           SET 
             unique_decline_count = ?,
             ticket_exp = ticket_exp + ?
           WHERE ticket_id = ?`,
        [newUniqueCount, xpToAdd, ticketId]
      );
    }

    // Calculate cooldown based on agent's decline count
    const [declines] = await db.execute(
      `SELECT COUNT(*) AS count 
         FROM ticket_decline_history 
         WHERE ticket_id = ? AND administrator_id = ?`,
      [ticketId, administratorId]
    );

    const cooldown = this.calculateCooldown(declines[0].count);

    res.json({
      message: "Ticket declined",
      cooldown,
      xpAdded: xpToAdd,
    });
  } catch (error) {
    console.error("Decline Error:", error);
    res.status(500).json({ message: "Failed to process decline" });
  }
};

// XP calculation (same as before)
exports.calculateXP = (uniqueDeclineCount) => {
  const xpMap = { 1: 50, 2: 100, 3: 150, 4: 200 };
  return xpMap[Math.min(uniqueDeclineCount, 4)] || 200;
};

// Cooldown calculation (same as before)
exports.calculateCooldown = (agentDeclineCount) => {
  const cooldownMap = { 1: 7200, 2: 14400, 3: 86400, 4: 86400 }; // In seconds
  return cooldownMap[Math.min(agentDeclineCount, 4)] || 86400;
};
