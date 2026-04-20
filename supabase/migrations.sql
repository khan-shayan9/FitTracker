-- ============================================
-- Fitness Tracker Feature Expansion Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  target_metric VARCHAR(100) NOT NULL, -- e.g., 'Weight', 'Waist'
  target_value DECIMAL(5,1) NOT NULL,
  starting_value DECIMAL(5,1),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Coach Notes Table
CREATE TABLE IF NOT EXISTS coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Weekly Check-ins Table
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Progress Photos Table
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- 6. Disable RLS rules for simplicity (mirroring existing app setup structure)
-- Allows our custom auth to handle everything
CREATE POLICY "Allow all on goals" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on coach_notes" ON coach_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on weekly_checkins" ON weekly_checkins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on progress_photos" ON progress_photos FOR ALL USING (true) WITH CHECK (true);

-- 7. Add Storage Bucket (Run only if running as superuser, otherwise do this manually)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');
