-- Migration: Add total_earnings column to collectors table
-- Date: 2026-01-04
-- Description: Add total_earnings field to track collector monetary earnings

ALTER TABLE collectors 
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;
