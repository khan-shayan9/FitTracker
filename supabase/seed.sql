-- ============================================
-- Fitness Tracker Web App - Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================

-- Create the first admin/trainer account
-- Username: admin
-- Password: admin123
SELECT create_user_with_password('admin', 'admin123', 'admin');
