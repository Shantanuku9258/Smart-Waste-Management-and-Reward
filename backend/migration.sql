DELIMITER //
CREATE PROCEDURE SafeAddEwasteColumns()
BEGIN
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'ml_predictions' AND column_name = 'state') THEN
        ALTER TABLE ml_predictions ADD COLUMN state VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'ml_predictions' AND column_name = 'year') THEN
        ALTER TABLE ml_predictions ADD COLUMN year INT;
    END IF;
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'ml_predictions' AND column_name = 'demand_level') THEN
        ALTER TABLE ml_predictions ADD COLUMN demand_level VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'ml_predictions' AND column_name = 'priority_level') THEN
        ALTER TABLE ml_predictions ADD COLUMN priority_level VARCHAR(50);
    END IF;
END //
DELIMITER ;

ALTER TABLE ml_predictions MODIFY COLUMN zone_id BIGINT NULL;
ALTER TABLE ml_predictions MODIFY COLUMN predicted_waste_kg DOUBLE NULL;

CALL SafeAddEwasteColumns();
DROP PROCEDURE SafeAddEwasteColumns;

DESCRIBE ml_predictions;
