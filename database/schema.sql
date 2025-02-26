DROP DATABASE IF EXISTS TicketingSystem;
CREATE DATABASE IF NOT EXISTS TicketingSystem;
USE TicketingSystem;

DROP TABLE IF EXISTS customer;
CREATE TABLE IF NOT EXISTS customer
(
	customer_id					INT							AUTO_INCREMENT				PRIMARY KEY,
    customer_name				VARCHAR(100)											NOT NULL,
    customer_email				VARCHAR(255)				UNIQUE						NOT NULL,
    customer_password   		VARCHAR(255)											NOT NULL,
    
    created_at					TIMESTAMP					DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS administrator;
CREATE TABLE IF NOT EXISTS administrator
(
	administrator_id			INT 						AUTO_INCREMENT				PRIMARY KEY,
    administrator_name 			VARCHAR(100)											NOT NULL,
    administrator_email			VARCHAR(255)				UNIQUE						NOT NULL,
    administrator_password		VARCHAR(255)											NOT NULL,
    administrator_role			ENUM('admin', 'agent')									NOT NULL,
    administrator_total_exp		INT														DEFAULT 0,
    
    created_at					TIMESTAMP					DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //
CREATE TRIGGER prevent_duplicate_email BEFORE INSERT ON customer
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM administrator WHERE administrator_email = NEW.customer_email) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
  END IF;
END;//

CREATE TRIGGER prevent_duplicate_email_admin BEFORE INSERT ON administrator
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM customer WHERE customer_email = NEW.administrator_email) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
  END IF;
END;//
DELIMITER ;

DROP TABLE IF EXISTS ticket;
CREATE TABLE IF NOT EXISTS ticket
(
	ticket_id					INT 						AUTO_INCREMENT				PRIMARY KEY,
    customer_id					INT 													NOT NULL,
    administrator_id			INT,
    
    ticket_title				VARCHAR(100)											NOT NULL,
    ticket_description			TEXT													NOT NULL,
    
    ticket_urgency				ENUM('low', 'medium', 'high'),
    ticket_impact				ENUM('low', 'medium', 'high'),
    ticket_priority				ENUM('low', 'medium', 'high'),
    ticket_status				ENUM('open', 'pending', 'resolved', 'unresolved')		DEFAULT 'open',
    
    ticket_exp					INT 													DEFAULT 100,
    unique_decline_count		INT														DEFAULT 0,
    
    created_at 					TIMESTAMP 					DEFAULT CURRENT_TIMESTAMP,
    resolved_at					TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customer (customer_id),
    FOREIGN KEY (administrator_id) REFERENCES administrator (administrator_id)
);

CREATE TABLE ticket_decline_history (
  decline_id 					INT 						AUTO_INCREMENT 				PRIMARY KEY,
  ticket_id 					INT 													NOT NULL,
  administrator_id 				INT 													NOT NULL,
  declined_at 					TIMESTAMP 												DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id),
  FOREIGN KEY (administrator_id) REFERENCES administrator(administrator_id),
  UNIQUE KEY unique_decline (ticket_id, administrator_id)
);