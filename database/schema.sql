DROP DATABASE IF EXISTS TicketingSystem;
CREATE DATABASE IF NOT EXISTS TicketingSystem;
USE TicketingSystem;

DROP TABLE IF EXISTS customer;
CREATE TABLE IF NOT EXISTS customer
(
	customer_id			INT							AUTO_INCREMENT		PRIMARY KEY,
    customer_name		VARCHAR(100)									NOT NULL,
    customer_email		VARCHAR(255)				UNIQUE				NOT NULL,
    customer_password   VARCHAR(255)									NOT NULL,
    created_at			TIMESTAMP					DEFAULT CURRENT_TIMESTAMP
);