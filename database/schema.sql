CREATE DATABASE IF NOT EXISTS smart_waste;
USE smart_waste;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER','COLLECTOR','ADMIN') DEFAULT 'USER',
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Zones
CREATE TABLE IF NOT EXISTS zones (
  zone_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  zone_name VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100)
);

-- 3. Collectors
CREATE TABLE IF NOT EXISTS collectors (
  collector_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  contact VARCHAR(20),
  vehicle_number VARCHAR(50),
  zone_id BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id)
);

-- 4. Waste Requests
CREATE TABLE IF NOT EXISTS waste_requests (
  request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  collector_id BIGINT,
  zone_id BIGINT,
  waste_type ENUM('PLASTIC','METAL','PAPER','ORGANIC','E_WASTE') NOT NULL,
  weight_kg DOUBLE NOT NULL,
  status ENUM('PENDING','IN_PROGRESS','COLLECTED','REJECTED') DEFAULT 'PENDING',
  pickup_address TEXT,
  image_url VARCHAR(512),
  collector_proof_url VARCHAR(512),
  scheduled_time DATETIME,
  collected_time DATETIME,
  reward_points INT DEFAULT 0,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (collector_id) REFERENCES collectors(collector_id),
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id)
);

-- 5. Reward Transactions
CREATE TABLE IF NOT EXISTS reward_transactions (
  transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  points_added INT DEFAULT 0,
  points_spent INT DEFAULT 0,
  transaction_type ENUM('ADD','REDEEM'),
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 6. Reward Catalog
CREATE TABLE IF NOT EXISTS reward_catalog (
  reward_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reward_name VARCHAR(255),
  points_required INT,
  details TEXT
);

-- 7. Waste Logs
CREATE TABLE IF NOT EXISTS waste_logs (
  log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  zone_id BIGINT,
  waste_type VARCHAR(50),
  collected_weight_kg DECIMAL(6,2),
  collection_date DATE,
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id)
);


