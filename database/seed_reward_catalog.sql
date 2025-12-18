-- Seed data for Reward Catalog
-- Eco-friendly items that users can redeem with their points

USE smart_waste;

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM reward_catalog;

-- Insert eco-friendly reward items
INSERT INTO reward_catalog (reward_name, points_required, details, active) VALUES
('Reusable Bottle', 10, 'High-quality stainless steel reusable water bottle. Perfect for reducing plastic waste. Durable and eco-friendly.', TRUE),
('Cloth Bag', 12, 'Eco-friendly cotton cloth bag. Reusable shopping bag to replace single-use plastic bags. Supports sustainable living.', TRUE),
('Small Dustbin', 20, 'Compact waste segregation dustbin for home use. Helps organize dry and wet waste properly. Made from recycled materials.', TRUE),
('Plant Sapling', 15, 'Native plant sapling to grow in your garden. Contributes to green environment and air purification. Includes care instructions.', TRUE);

-- Optional: Add more items
-- INSERT INTO reward_catalog (reward_name, points_required, details, active) VALUES
-- ('Compost Bin', 30, 'Home composting bin for organic waste. Convert kitchen waste into nutrient-rich compost.', TRUE),
-- ('Reusable Cutlery Set', 25, 'Stainless steel reusable cutlery set (spoon, fork, knife). Perfect for reducing single-use plastic cutlery.', TRUE);

