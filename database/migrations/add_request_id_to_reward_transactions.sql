-- Migration: Add request_id column to reward_transactions table
-- This enables duplicate prevention and better tracking of reward sources

USE smart_waste;

-- Add request_id column if it doesn't exist
ALTER TABLE reward_transactions 
ADD COLUMN IF NOT EXISTS request_id BIGINT AFTER user_id;

-- Add foreign key constraint if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS for foreign keys, so this may need manual handling
-- ALTER TABLE reward_transactions 
-- ADD CONSTRAINT fk_reward_transactions_request_id 
-- FOREIGN KEY (request_id) REFERENCES waste_requests(request_id);

-- For MySQL, you may need to run this separately if the foreign key doesn't exist:
-- ALTER TABLE reward_transactions 
-- ADD CONSTRAINT fk_reward_transactions_request_id 
-- FOREIGN KEY (request_id) REFERENCES waste_requests(request_id);

