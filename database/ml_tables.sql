-- ML Service Database Tables
-- Matches JPA entities: MLPrediction, MLClassification, UserEcoScore
-- Prerequisites: database/schema.sql (users, zones, waste_requests)

USE smart_waste;

-- 1. ml_predictions — zone waste forecasts + e-waste state predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
  prediction_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  zone_id              BIGINT NULL,
  predicted_waste_kg   DOUBLE NULL,
  historical_waste_kg  DOUBLE NULL,
  day_of_week          INT NULL,
  month                INT NULL,
  year                 INT NULL,
  prediction_date      DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  state                VARCHAR(255) NULL,
  predicted_generation DOUBLE NULL,
  demand_level         VARCHAR(50) NULL,
  priority_level       VARCHAR(50) NULL,
  INDEX idx_zone_date (zone_id, prediction_date),
  INDEX idx_prediction_date (prediction_date),
  INDEX idx_state_year_month (state, year, month),
  CONSTRAINT fk_ml_predictions_zone
    FOREIGN KEY (zone_id) REFERENCES zones(zone_id)
);

-- 2. ml_classifications — ML waste-type results per request
CREATE TABLE IF NOT EXISTS ml_classifications (
  classification_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id          BIGINT NULL,
  waste_type          VARCHAR(50) NOT NULL,
  confidence          DOUBLE NULL,
  description         TEXT NULL,
  classification_date DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_request_id (request_id),
  INDEX idx_classification_date (classification_date),
  CONSTRAINT fk_ml_classifications_request
    FOREIGN KEY (request_id) REFERENCES waste_requests(request_id)
);

-- 3. user_eco_scores — eco score history per user
CREATE TABLE IF NOT EXISTS user_eco_scores (
  score_id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id                BIGINT NOT NULL,
  eco_score              INT NOT NULL,
  activity_score         DOUBLE NULL,
  segregation_score      DOUBLE NULL,
  frequency_score        INT NULL,
  weight_score           INT NULL,
  user_activity          INT DEFAULT 0,
  segregation_accuracy   DOUBLE NULL,
  request_frequency      DOUBLE NULL,
  avg_weight             DOUBLE NULL,
  calculated_date        DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_user_id (user_id),
  INDEX idx_calculated_date (calculated_date),
  INDEX idx_eco_score (eco_score),
  CONSTRAINT fk_user_eco_scores_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT chk_eco_score_range CHECK (eco_score >= 0 AND eco_score <= 100)
);
