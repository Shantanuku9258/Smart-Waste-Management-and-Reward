-- Idempotent upgrade for existing smart_waste databases.
-- Aligns ml_predictions, ml_classifications, user_eco_scores with JPA entities.
-- Safe to run multiple times.

USE smart_waste;

-- ── ml_predictions: add missing columns ──────────────────────────────────────
SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ml_predictions' AND COLUMN_NAME = 'year') = 0,
  'ALTER TABLE ml_predictions ADD COLUMN year INT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ml_predictions' AND COLUMN_NAME = 'state') = 0,
  'ALTER TABLE ml_predictions ADD COLUMN state VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ml_predictions' AND COLUMN_NAME = 'predicted_generation') = 0,
  'ALTER TABLE ml_predictions ADD COLUMN predicted_generation DOUBLE NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ml_predictions' AND COLUMN_NAME = 'demand_level') = 0,
  'ALTER TABLE ml_predictions ADD COLUMN demand_level VARCHAR(50) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ml_predictions' AND COLUMN_NAME = 'priority_level') = 0,
  'ALTER TABLE ml_predictions ADD COLUMN priority_level VARCHAR(50) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Nullable zone/e-waste fields (Hibernate + e-waste endpoints)
ALTER TABLE ml_predictions MODIFY COLUMN zone_id BIGINT NULL;
ALTER TABLE ml_predictions MODIFY COLUMN predicted_waste_kg DOUBLE NULL;
ALTER TABLE ml_predictions MODIFY COLUMN historical_waste_kg DOUBLE NULL;
ALTER TABLE ml_predictions MODIFY COLUMN day_of_week INT NULL;
ALTER TABLE ml_predictions MODIFY COLUMN month INT NULL;

-- Normalize timestamp precision to match JPA
ALTER TABLE ml_predictions MODIFY COLUMN prediction_date DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6);

-- ── ml_classifications ─────────────────────────────────────────────────────────
ALTER TABLE ml_classifications MODIFY COLUMN confidence DOUBLE NULL;
ALTER TABLE ml_classifications MODIFY COLUMN description TEXT NULL;
ALTER TABLE ml_classifications MODIFY COLUMN classification_date DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6);

-- ── user_eco_scores ────────────────────────────────────────────────────────────
ALTER TABLE user_eco_scores MODIFY COLUMN activity_score DOUBLE NULL;
ALTER TABLE user_eco_scores MODIFY COLUMN segregation_score DOUBLE NULL;
ALTER TABLE user_eco_scores MODIFY COLUMN segregation_accuracy DOUBLE NULL;
ALTER TABLE user_eco_scores MODIFY COLUMN request_frequency DOUBLE NULL;
ALTER TABLE user_eco_scores MODIFY COLUMN avg_weight DOUBLE NULL;
ALTER TABLE user_eco_scores MODIFY COLUMN calculated_date DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6);

-- ── Indexes (MySQL has no CREATE INDEX IF NOT EXISTS) ─────────────────────────
DELIMITER //
CREATE PROCEDURE AddIndexIfMissing(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns VARCHAR(255)
)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index) = 0 THEN
    SET @idx_sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, ' (', p_columns, ')');
    PREPARE idx_stmt FROM @idx_sql;
    EXECUTE idx_stmt;
    DEALLOCATE PREPARE idx_stmt;
  END IF;
END //
DELIMITER ;

CALL AddIndexIfMissing('ml_predictions', 'idx_ml_predictions_zone_date', 'zone_id, prediction_date');
CALL AddIndexIfMissing('ml_predictions', 'idx_ml_predictions_prediction_date', 'prediction_date');
CALL AddIndexIfMissing('ml_predictions', 'idx_ml_predictions_state_year_month', 'state, year, month');

CALL AddIndexIfMissing('ml_classifications', 'idx_ml_classifications_request_id', 'request_id');
CALL AddIndexIfMissing('ml_classifications', 'idx_ml_classifications_date', 'classification_date');

CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_user_id', 'user_id');
CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_user_date', 'user_id, calculated_date');
CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_calculated_date', 'calculated_date');
CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_eco_score', 'eco_score');

DROP PROCEDURE AddIndexIfMissing;

-- ── Foreign keys (only if missing) ─────────────────────────────────────────────
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ml_predictions' AND CONSTRAINT_NAME = 'fk_ml_predictions_zone') = 0,
  'ALTER TABLE ml_predictions ADD CONSTRAINT fk_ml_predictions_zone FOREIGN KEY (zone_id) REFERENCES zones(zone_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ml_classifications' AND CONSTRAINT_NAME = 'fk_ml_classifications_request') = 0,
  'ALTER TABLE ml_classifications ADD CONSTRAINT fk_ml_classifications_request FOREIGN KEY (request_id) REFERENCES waste_requests(request_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_eco_scores' AND CONSTRAINT_NAME = 'fk_user_eco_scores_user') = 0,
  'ALTER TABLE user_eco_scores ADD CONSTRAINT fk_user_eco_scores_user FOREIGN KEY (user_id) REFERENCES users(user_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Eco score range check (MySQL 8+)
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_eco_scores' AND CONSTRAINT_NAME = 'chk_eco_score_range') = 0,
  'ALTER TABLE user_eco_scores ADD CONSTRAINT chk_eco_score_range CHECK (eco_score >= 0 AND eco_score <= 100)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
