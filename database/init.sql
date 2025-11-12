-- Smart Waste Management - initial schema (minimal placeholder)
CREATE DATABASE IF NOT EXISTS smart_waste;
USE smart_waste;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('USER','COLLECTOR','ADMIN'),
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


