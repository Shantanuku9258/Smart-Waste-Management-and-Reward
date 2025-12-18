-- Migration: Add redemption_requests table and active column to reward_catalog
-- This enables the complete reward redemption flow

USE smart_waste;

-- Add active column to reward_catalog if it doesn't exist
ALTER TABLE reward_catalog 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Create redemption_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS redemption_requests (
  redemption_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  reward_id BIGINT NOT NULL,
  points_used INT NOT NULL,
  status ENUM('REQUESTED','FULFILLED') DEFAULT 'REQUESTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (reward_id) REFERENCES reward_catalog(reward_id)
);

-- Note: MySQL doesn't support IF NOT EXISTS for ENUM types in ALTER TABLE
-- If the table already exists with different structure, you may need to manually adjust

