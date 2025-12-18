-- Analytics Performance Indexes
-- Add these indexes to optimize analytics queries

USE smart_waste;

-- Indexes for waste_requests table (analytics queries)
CREATE INDEX IF NOT EXISTS idx_waste_requests_status ON waste_requests(status);
CREATE INDEX IF NOT EXISTS idx_waste_requests_zone_id ON waste_requests(zone_id);
CREATE INDEX IF NOT EXISTS idx_waste_requests_waste_type ON waste_requests(waste_type);
CREATE INDEX IF NOT EXISTS idx_waste_requests_collected_time ON waste_requests(collected_time);
CREATE INDEX IF NOT EXISTS idx_waste_requests_request_date ON waste_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_waste_requests_collector_id ON waste_requests(collector_id);
CREATE INDEX IF NOT EXISTS idx_waste_requests_user_id ON waste_requests(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_waste_requests_status_collected_time ON waste_requests(status, collected_time);
CREATE INDEX IF NOT EXISTS idx_waste_requests_zone_status ON waste_requests(zone_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_requests_type_status ON waste_requests(waste_type, status);

-- Indexes for ml_predictions (already have some, but adding composite)
CREATE INDEX IF NOT EXISTS idx_ml_predictions_zone_date ON ml_predictions(zone_id, prediction_date);

-- Indexes for user_eco_scores
CREATE INDEX IF NOT EXISTS idx_user_eco_scores_user_date ON user_eco_scores(user_id, calculated_date);

