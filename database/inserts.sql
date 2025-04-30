USE TicketingSystem;

SELECT * FROM customer;
SELECT * FROM administrator;
SELECT * FROM ticket WHERE customer_id = 1;
SELECT * FROM ticket_decline_history;

SELECT * FROM ticket_message WHERE ticket_id = 10;