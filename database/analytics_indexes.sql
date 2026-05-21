-- Analytics Performance Indexes (idempotent, MySQL 8 compatible)
-- Run after schema.sql and ml_tables.sql

USE smart_waste;

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

-- waste_requests
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_status', 'status');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_zone_id', 'zone_id');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_waste_type', 'waste_type');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_collected_time', 'collected_time');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_request_date', 'request_date');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_collector_id', 'collector_id');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_user_id', 'user_id');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_status_collected_time', 'status, collected_time');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_zone_status', 'zone_id, status');
CALL AddIndexIfMissing('waste_requests', 'idx_waste_requests_type_status', 'waste_type, status');

-- ml_predictions
CALL AddIndexIfMissing('ml_predictions', 'idx_ml_predictions_zone_date', 'zone_id, prediction_date');
CALL AddIndexIfMissing('ml_predictions', 'idx_ml_predictions_prediction_date', 'prediction_date');
CALL AddIndexIfMissing('ml_predictions', 'idx_ml_predictions_state_year_month', 'state, year, month');

-- ml_classifications
CALL AddIndexIfMissing('ml_classifications', 'idx_ml_classifications_request_id', 'request_id');
CALL AddIndexIfMissing('ml_classifications', 'idx_ml_classifications_date', 'classification_date');

-- user_eco_scores
CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_user_id', 'user_id');
CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_user_date', 'user_id, calculated_date');
CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_calculated_date', 'calculated_date');
CALL AddIndexIfMissing('user_eco_scores', 'idx_user_eco_scores_eco_score', 'eco_score');

DROP PROCEDURE AddIndexIfMissing;
