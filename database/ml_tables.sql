-- ML Service Database Tables
-- Add these tables to support ML predictions and analytics

USE smart_waste;

-- 1. ML Predictions Table
-- Stores waste quantity predictions for zones
CREATE TABLE IF NOT EXISTS ml_predictions (
  prediction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  zone_id BIGINT NOT NULL,
  predicted_waste_kg DECIMAL(10, 2) NOT NULL,
  historical_waste_kg DECIMAL(10, 2),
  day_of_week INT,
  month INT,
  prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id),
  INDEX idx_zone_date (zone_id, prediction_date),
  INDEX idx_prediction_date (prediction_date)
);

-- 2. ML Classifications Table
-- Stores waste type classifications
CREATE TABLE IF NOT EXISTS ml_classifications (
  classification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id BIGINT,
  waste_type VARCHAR(50) NOT NULL,
  confidence DECIMAL(5, 2),
  description TEXT,
  classification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES waste_requests(request_id),
  INDEX idx_request_id (request_id),
  INDEX idx_classification_date (classification_date)
);

-- 3. User Eco Scores Table
-- Stores calculated eco scores for users
CREATE TABLE IF NOT EXISTS user_eco_scores (
  score_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  eco_score INT NOT NULL CHECK (eco_score >= 0 AND eco_score <= 100),
  activity_score DECIMAL(5, 2),
  segregation_score DECIMAL(5, 2),
  frequency_score INT,
  weight_score INT,
  user_activity INT DEFAULT 0,
  segregation_accuracy DECIMAL(5, 2),
  request_frequency DECIMAL(5, 2),
  avg_weight DECIMAL(5, 2),
  calculated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_calculated_date (calculated_date),
  INDEX idx_eco_score (eco_score)
);

