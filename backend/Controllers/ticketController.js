const db = require("../Util/db");
const { assessTicket } = require("./aiController");
const RESERVATION_WINDOW = 2; // Number of tickets to reserve ahead

exports.getReservedTickets = async (req, res) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  async function attemptReservation() {
    try {
      const { administratorId } = req.body;
      console.log(
        `[DEBUG] Attempting reservation for admin ID: ${administratorId}`
      );

      const connection = await db.getConnection();

      try {
        // Check if the admin already has reserved tickets
        const [existingReservations] = await connection.execute(
          `SELECT t.* FROM ticket t
           WHERE t.is_reserved = true 
           AND t.ticket_status = 'open'
           AND t.last_reservation_time IS NOT NULL 
           AND TIMESTAMPDIFF(MINUTE, t.last_reservation_time, NOW()) < 5
           ORDER BY FIELD(t.ticket_priority, 'high', 'medium', 'low'),
                    t.ticket_exp DESC,
                    t.created_at ASC`,
          []
        );

        // If admin already has active reservations, return those
        if (existingReservations.length > 0) {
          console.log(
            `[DEBUG] Found ${existingReservations.length} existing reserved tickets`
          );

          // Update reservation timestamps
          for (const ticket of existingReservations) {
            await connection.execute(
              `UPDATE ticket 
               SET last_reservation_time = CURRENT_TIMESTAMP 
               WHERE ticket_id = ?`,
              [ticket.ticket_id]
            );
          }

          // Format tickets for frontend
          const formattedTickets = existingReservations.map((ticket) => ({
            ticketId: ticket.ticket_id,
            title: ticket.ticket_title,
            description: ticket.ticket_description,
            ticketDescription: ticket.ticket_description,
            priority: ticket.ticket_priority || "medium",
            xp: ticket.ticket_exp,
            timestamp: ticket.created_at,
            username: "Customer",
            status: ticket.ticket_status,
          }));

          return res.json({
            tickets: formattedTickets,
            message: "Returned existing reserved tickets",
          });
        }

        // Use READ COMMITTED isolation level to reduce lock contention
        await connection.execute(
          "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
        );
        await connection.beginTransaction();

        // Release abandoned tickets with a short transaction
        try {
          const [releaseResult] = await connection.execute(
            `UPDATE ticket 
             SET is_reserved = false, last_reservation_time = NULL
             WHERE is_reserved = true 
             AND ticket_status = 'open'
             AND (last_reservation_time IS NULL OR 
                  TIMESTAMPDIFF(MINUTE, last_reservation_time, NOW()) > 5)`,
            []
          );
          console.log(
            `[DEBUG] Released ${releaseResult.affectedRows} abandoned tickets`
          );
        } catch (err) {
          console.warn(
            "[DEBUG] Failed to release abandoned tickets:",
            err.message
          );
        }

        // Find tickets that are still in cooldown for this admin
        const [declinedTickets] = await connection.execute(
          `SELECT tdh.ticket_id, MAX(tdh.declined_at) AS last_declined 
           FROM ticket_decline_history tdh 
           WHERE tdh.administrator_id = ? 
           GROUP BY tdh.ticket_id`,
          [administratorId]
        );

        // Build a list of tickets to exclude due to cooldown
        let excludedTicketIds = [];
        const now = new Date();

        for (const declined of declinedTickets) {
          const declineCount = await getDeclineCount(
            connection,
            declined.ticket_id,
            administratorId
          );
          const cooldownSeconds = calculateCooldown(declineCount);
          const lastDeclinedTime = new Date(declined.last_declined);
          const cooldownEnds = new Date(
            lastDeclinedTime.getTime() + cooldownSeconds * 1000
          );

          if (now < cooldownEnds) {
            excludedTicketIds.push(declined.ticket_id);
          }
        }

        console.log(
          `[DEBUG] Excluding ${
            excludedTicketIds.length
          } tickets due to cooldown: ${excludedTicketIds.join(", ")}`
        );

        // Build the exclusion clause
        const excludeClause =
          excludedTicketIds.length > 0
            ? `AND ticket_id NOT IN (${excludedTicketIds.join(",")})`
            : "";

        // Get current ticket - now with cooldown exclusion
        const [current] = await connection.execute(
          `SELECT * FROM ticket
           WHERE ticket_status = 'open' AND is_reserved = false
           ${excludeClause}
           ORDER BY FIELD(ticket_priority, 'high', 'medium', 'low'),
                    ticket_exp DESC,
                    created_at ASC
           LIMIT 1 FOR UPDATE SKIP LOCKED`,
          []
        );

        console.log(
          `[DEBUG] Found ${current.length} tickets for current selection`
        );

        if (current.length === 0) {
          await connection.commit();
          console.log(`[DEBUG] No tickets available to reserve`);
          return res.json({ tickets: [] });
        }

        // Reserve current ticket
        await connection.execute(
          `UPDATE ticket 
           SET is_reserved = true, last_reservation_time = CURRENT_TIMESTAMP
           WHERE ticket_id = ?`,
          [current[0].ticket_id]
        );
        console.log(
          `[DEBUG] Reserved ticket ID: ${current[0].ticket_id} as current ticket`
        );

        // Get and reserve next tickets - also with cooldown exclusion
        const reservationCount = Math.max(0, RESERVATION_WINDOW - 1);
        let nextTickets = [];

        if (reservationCount > 0) {
          [nextTickets] = await connection.execute(
            `SELECT * FROM ticket
             WHERE ticket_status = 'open' AND is_reserved = false
             ${excludeClause}
             ORDER BY FIELD(ticket_priority, 'high', 'medium', 'low'),
                      ticket_exp DESC,
                      created_at ASC
             LIMIT ${reservationCount} FOR UPDATE SKIP LOCKED`,
            []
          );

          console.log(
            `[DEBUG] Found ${nextTickets.length} tickets for next selection`
          );

          // Reserve next tickets one by one to reduce lock contention
          for (const ticket of nextTickets) {
            await connection.execute(
              `UPDATE ticket 
               SET is_reserved = true, last_reservation_time = CURRENT_TIMESTAMP 
               WHERE ticket_id = ?`,
              [ticket.ticket_id]
            );
            console.log(
              `[DEBUG] Reserved ticket ID: ${ticket.ticket_id} as upcoming ticket`
            );
          }
        }

        await connection.commit();
        console.log(`[DEBUG] Transaction committed successfully`);

        // Format tickets for frontend
        const allTickets = [current[0], ...nextTickets].map((ticket) => ({
          ticketId: ticket.ticket_id,
          title: ticket.ticket_title,
          description: ticket.ticket_description,
          ticketDescription: ticket.ticket_description,
          priority: ticket.ticket_priority || "medium",
          xp: ticket.ticket_exp,
          timestamp: ticket.created_at,
          username: "Customer",
          status: ticket.ticket_status,
        }));

        console.log(`[DEBUG] Sending ${allTickets.length} tickets to frontend`);

        res.json({
          tickets: allTickets,
          message: "Tickets reserved successfully",
        });
      } catch (error) {
        await connection.rollback();
        console.error(`[DEBUG] Transaction rolled back: ${error.message}`);
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      // Auto-retry logic for deadlocks
      if (error.code === "ER_LOCK_DEADLOCK" && retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(
          `[DEBUG] Deadlock detected, retry attempt ${retryCount}...`
        );
        // Exponential backoff before retrying
        const delay = 100 * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptReservation();
      }

      console.error("[DEBUG] Reservation Error:", error);
      res.status(500).json({
        message: "Failed to reserve tickets",
        error: error.message,
      });
    }
  }

  // Helper function to get decline count for a ticket and admin
  async function getDeclineCount(connection, ticketId, adminId) {
    const [result] = await connection.execute(
      `SELECT COUNT(*) AS count FROM ticket_decline_history
       WHERE ticket_id = ? AND administrator_id = ?`,
      [ticketId, adminId]
    );
    return result[0].count;
  }

  await attemptReservation();
};

exports.releaseReservation = async (req, res) => {
  try {
    const { ticketIds } = req.body;

    if (!ticketIds || !ticketIds.length) {
      console.log("[DEBUG] Release request with no ticket IDs");
      return res.status(400).json({ message: "No ticket IDs provided" });
    }

    console.log(
      `[DEBUG] Attempting to release tickets: ${JSON.stringify(ticketIds)}`
    );

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Track how many tickets were actually released
      let releasedCount = 0;

      // Release each ticket individually
      for (const ticketId of ticketIds) {
        const [result] = await connection.execute(
          `UPDATE ticket 
           SET is_reserved = false, last_reservation_time = NULL 
           WHERE ticket_id = ? AND ticket_status = 'open'`,
          [ticketId]
        );

        if (result.affectedRows > 0) {
          releasedCount++;
          console.log(`[DEBUG] Successfully released ticket ID: ${ticketId}`);
        } else {
          console.log(
            `[DEBUG] Ticket ID ${ticketId} was not released (not found or not open)`
          );
        }
      }

      await connection.commit();
      console.log(
        `[DEBUG] Released ${releasedCount} of ${ticketIds.length} tickets`
      );

      res.json({
        message: "Reservations released successfully",
        releasedCount,
      });
    } catch (error) {
      await connection.rollback();
      console.error(`[DEBUG] Failed to release tickets: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[DEBUG] Release Error:", error);
    res.status(500).json({
      message: "Failed to release reservation",
      error: error.message,
    });
  }
};

exports.heartbeatReservation = async (req, res) => {
  try {
    const { administratorId, ticketIds } = req.body;

    if (!ticketIds || !ticketIds.length) {
      return res.status(400).json({ message: "No ticket IDs provided" });
    }

    console.log(
      `[DEBUG] Heartbeat received for admin ${administratorId}, tickets: ${JSON.stringify(
        ticketIds
      )}`
    );

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update last_reservation_time for all the agent's reserved tickets
      const placeholders = ticketIds.map(() => "?").join(",");
      const [result] = await connection.execute(
        `UPDATE ticket 
         SET last_reservation_time = CURRENT_TIMESTAMP
         WHERE ticket_id IN (${placeholders}) 
         AND is_reserved = true
         AND ticket_status = 'open'`,
        [...ticketIds]
      );

      await connection.commit();
      console.log(
        `[DEBUG] Updated ${result.affectedRows} ticket reservations in heartbeat`
      );

      res.json({
        message: "Heartbeat received",
        updatedCount: result.affectedRows,
      });
    } catch (error) {
      await connection.rollback();
      console.error(`[DEBUG] Heartbeat error: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[DEBUG] Heartbeat Error:", error);
    res
      .status(500)
      .json({ message: "Failed to process heartbeat", error: error.message });
  }
};

exports.releaseTimedOutReservations = async () => {
  try {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Release tickets that haven't had a heartbeat in 5 minutes
      const [result] = await connection.execute(
        `UPDATE ticket 
         SET is_reserved = false, last_reservation_time = NULL
         WHERE is_reserved = true 
         AND ticket_status = 'open'
         AND (last_reservation_time IS NULL OR 
              TIMESTAMPDIFF(MINUTE, last_reservation_time, NOW()) > 5)`,
        []
      );

      await connection.commit();
      if (result.affectedRows > 0) {
        console.log(
          `[DEBUG] Released ${result.affectedRows} timed-out ticket reservations`
        );
      }
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[DEBUG] Error releasing timed-out reservations:", error);
    return 0;
  }
};

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

exports.getTicketById = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const [ticket] = await db.execute(
      "SELECT * FROM ticket WHERE ticket_id = ?",
      [ticketId]
    );

    res.json(ticket[0] || null); // Return null if no ticket found
  } catch (error) {
    console.error("Get Ticket Error:", error);
    res.status(500).json({
      message: "Failed to fetch ticket details",
      error: error.message,
    });
  }
};

exports.getTicketMessages = async (req, res) => {
  const ticketId = parseInt(req.params.ticketId, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ message: "Invalid ticket ID" });
  }

  try {
    const [messages] = await db.execute(
      `SELECT 
        message_id AS messageId,
        sender_type AS senderType,
        sender_id AS senderId,
        message_content AS messageContent,
        sent_at AS sentAt
       FROM ticket_message
       WHERE ticket_id = ?
       ORDER BY sent_at ASC`,
      [ticketId]
    );

    res.json(
      messages.map((msg) => ({
        ...msg,
        sentAt: new Date(msg.sentAt).toISOString(),
      }))
    );
  } catch (error) {
    console.error("Get Ticket Messages Error:", error);
    res.status(500).json({
      message: "Failed to fetch ticket messages",
      error: error.message,
    });
  }
};

exports.sendTicketMessage = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    let { content, senderType, senderId } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    if (!content || !senderType || !senderId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    if(senderType === "admin") senderType = "administrator";

    // Insert message into database
    const [result] = await db.execute(
      `INSERT INTO ticket_message 
        (ticket_id, sender_type, sender_id, message_content)
       VALUES (?, ?, ?, ?)`,
      [ticketId, senderType, senderId, content]
    );

    // Get inserted message to return in response
    const [message] = await db.execute(
      `SELECT 
        message_id AS messageId,
        sender_type AS senderType,
        sender_id AS senderId,
        message_content AS messageContent,
        sent_at AS sentAt
       FROM ticket_message
       WHERE message_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Message sent successfully",
      messageId: result.insertId,
      ...message[0],
    });
  } catch (error) {
    console.error("Send Ticket Message Error:", error);
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

exports.assignTicketToAgent = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    const { administratorId } = req.body;
    const connection = await db.getConnection();

    console.log(
      `[DEBUG] Assigning ticket ${ticketId} to admin ${administratorId}`
    );

    try {
      await connection.beginTransaction();

      // Update the ticket
      const [result] = await connection.execute(
        `UPDATE ticket
         SET
           administrator_id = ?,
           ticket_status = "pending",
           is_reserved = false,
           last_reservation_time = NULL
         WHERE ticket_id = ?`,
        [administratorId, ticketId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        console.log(`[DEBUG] Ticket ${ticketId} not found or already assigned`);
        return res
          .status(404)
          .json({ message: "Ticket not found or already assigned" });
      }

      // Get ticket XP for response
      const [ticket] = await connection.execute(
        `SELECT ticket_exp FROM ticket WHERE ticket_id = ?`,
        [ticketId]
      );

      // Add XP to administrator
      if (ticket.length > 0) {
        await connection.execute(
          `UPDATE administrator
           SET administrator_total_exp = administrator_total_exp + ?
           WHERE administrator_id = ?`,
          [ticket[0].ticket_exp, administratorId]
        );
        console.log(
          `[DEBUG] Added ${ticket[0].ticket_exp} XP to admin ${administratorId}`
        );
      }

      await connection.commit();

      res.json({
        message: "Ticket assigned successfully",
        xp: ticket.length > 0 ? ticket[0].ticket_exp : 0,
      });
    } catch (error) {
      await connection.rollback();
      console.error(`[DEBUG] Error assigning ticket: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[DEBUG] Assign Error:", error);
    res
      .status(500)
      .json({ message: "Failed to assign ticket", error: error.message });
  }
};

exports.declineTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { administratorId } = req.body;

  console.log(
    `[DEBUG] Declining ticket ${ticketId} by admin ${administratorId}`
  );

  try {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Record the decline
      await connection.execute(
        `INSERT INTO ticket_decline_history
         (ticket_id, administrator_id)
         VALUES (?, ?)`,
        [ticketId, administratorId]
      );

      // Check how many times this agent has declined this ticket
      const [existing] = await connection.execute(
        `SELECT COUNT(*) AS count FROM ticket_decline_history
         WHERE ticket_id = ? AND administrator_id = ?`,
        [ticketId, administratorId]
      );

      let xpToAdd = 0;

      if (existing[0].count === 1) {
        // First decline by this agent
        // Get current ticket data
        const [ticket] = await connection.execute(
          `SELECT unique_decline_count
           FROM ticket
           WHERE ticket_id = ?`,
          [ticketId]
        );

        const newUniqueCount = ticket[0].unique_decline_count + 1;
        xpToAdd = calculateXP(newUniqueCount);

        console.log(
          `[DEBUG] First decline by admin ${administratorId} for ticket ${ticketId}. Adding ${xpToAdd} XP.`
        );

        await connection.execute(
          `UPDATE ticket
           SET
             is_reserved = false,
             last_reservation_time = NULL,
             unique_decline_count = ?,
             ticket_exp = ticket_exp + ?
           WHERE ticket_id = ?`,
          [newUniqueCount, xpToAdd, ticketId]
        );
      } else {
        // Just update reserved status
        console.log(
          `[DEBUG] Repeat decline by admin ${administratorId} for ticket ${ticketId}`
        );

        await connection.execute(
          `UPDATE ticket 
           SET is_reserved = false, last_reservation_time = NULL 
           WHERE ticket_id = ?`,
          [ticketId]
        );
      }

      // Calculate cooldown based on agent's decline count
      const cooldown = calculateCooldown(existing[0].count);
      const cooldownEnds = new Date(Date.now() + cooldown * 1000);

      console.log(
        `[DEBUG] Ticket ${ticketId} on cooldown for admin ${administratorId} until ${cooldownEnds.toISOString()}`
      );

      await connection.commit();

      res.json({
        message: "Ticket declined",
        cooldown,
        cooldownEnds: cooldownEnds.toISOString(),
        xpAdded: xpToAdd,
      });
    } catch (error) {
      await connection.rollback();
      console.error(`[DEBUG] Error declining ticket: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[DEBUG] Decline Error:", error);
    res
      .status(500)
      .json({ message: "Failed to process decline", error: error.message });
  }
};

exports.getCustomerTickets = async (req, res) => {
  const { customerId } = req.body;

  console.log(req.body);

  try {
    const [tickets] = await db.execute(
      `SELECT ticket_id, ticket_title, ticket_description, ticket_status, ticket_priority, created_at
       FROM ticket
       WHERE customer_id = ?`,
      [customerId]
    );

    res.json(
      tickets.map((ticket) => ({
        ...ticket,
        createdAt: new Date(ticket.created_at).toISOString(),
      }))
    );
  } catch (error) {
    console.error("Get Customer Tickets Error:", error);
    res.status(500).json({
      message: "Failed to fetch customer tickets",
      error: error.message,
    });
  }
};

exports.getAdminTickets = async (req, res) => {
  try {
    const { administratorId } = req.body;

    if (!administratorId) {
      return res.status(400).json({ message: "Administrator ID is required" });
    }

    // Get tickets assigned to this admin with corrected query
    const [tickets] = await db.execute(
      `SELECT t.*, 
          c.customer_name, 
          c.customer_email as customerEmail
        FROM ticket t
        LEFT JOIN customer c ON t.customer_id = c.customer_id
        WHERE t.administrator_id = ?
        ORDER BY
          CASE 
            WHEN t.ticket_status = 'open' THEN 1
            WHEN t.ticket_status = 'pending' THEN 2
            WHEN t.ticket_status = 'resolved' THEN 3
            WHEN t.ticket_status = 'unresolved' THEN 4
            ELSE 5
          END,
          t.created_at DESC`,
      [administratorId]
    );

    res.json(tickets);
  } catch (error) {
    console.error("Get Admin Tickets Error:", error);
    res.status(500).json({
      message: "Failed to fetch admin tickets",
      error: error.message,
    });
  }
};

// XP calculation
function calculateXP(uniqueDeclineCount) {
  const xpMap = { 1: 50, 2: 100, 3: 150, 4: 200 };
  return xpMap[Math.min(uniqueDeclineCount, 4)] || 200;
}

// Cooldown calculation
function calculateCooldown(agentDeclineCount) {
  const cooldownMap = { 1: 7200, 2: 14400, 3: 86400, 4: 86400 }; // In seconds
  return cooldownMap[Math.min(agentDeclineCount, 4)] || 86400;
}

async function getDeclineCount(connection, ticketId, adminId) {
  const [result] = await connection.execute(
    `SELECT COUNT(*) AS count FROM ticket_decline_history
     WHERE ticket_id = ? AND administrator_id = ?`,
    [ticketId, adminId]
  );
  return result[0].count;
}

// Export the functions for use in other modules
exports.calculateXP = calculateXP;
exports.calculateCooldown = calculateCooldown;
exports.getDeclineCount = getDeclineCount;
