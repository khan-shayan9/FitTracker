-- ============================================
-- Fitness Tracker Web App - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fitness_goal AS ENUM ('fat_loss', 'muscle_gain');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  trainer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age INT,
  height DECIMAL(5,1),
  starting_weight DECIMAL(5,1),
  current_weight DECIMAL(5,1),
  goal fitness_goal NOT NULL DEFAULT 'fat_loss',
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  chest DECIMAL(5,1),
  waist DECIMAL(5,1),
  arms DECIMAL(5,1),
  thigh DECIMAL(5,1),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_trainer ON clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_client ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 7. Auto-update updated_at on clients
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON clients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. RPC: Authenticate user (password never leaves the DB)
CREATE OR REPLACE FUNCTION authenticate_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  role user_role,
  trainer_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role, u.trainer_id
  FROM users u
  WHERE u.username = p_username
    AND u.password = crypt(p_password, u.password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: Create user with hashed password
CREATE OR REPLACE FUNCTION create_user_with_password(
  p_username TEXT,
  p_password TEXT,
  p_role user_role,
  p_trainer_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO users (username, password, role, trainer_id)
  VALUES (p_username, crypt(p_password, gen_salt('bf')), p_role, p_trainer_id)
  RETURNING users.id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RPC: Reset user password (admin can reset client passwords)
CREATE OR REPLACE FUNCTION reset_user_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Disable RLS for simplicity (custom auth handles access control)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for anon key
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on measurements" ON measurements FOR ALL USING (true) WITH CHECK (true);
