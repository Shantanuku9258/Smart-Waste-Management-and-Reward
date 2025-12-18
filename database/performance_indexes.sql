-- Performance Indexes for Phase 6
-- Additional indexes for foreign keys and date columns

USE smart_waste;

-- Foreign key indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_collectors_email ON collectors(email);
CREATE INDEX IF NOT EXISTS idx_collectors_zone_id ON collectors(zone_id);

-- Date-based indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_created_at ON reward_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_waste_requests_user_status ON waste_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_requests_collector_status ON waste_requests(collector_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_requests_zone_status_date ON waste_requests(zone_id, status, request_date);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_waste_logs_zone_date ON waste_logs(zone_id, collection_date);
CREATE INDEX IF NOT EXISTS idx_waste_logs_type_date ON waste_logs(waste_type, collection_date);

