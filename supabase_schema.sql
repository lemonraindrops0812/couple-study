-- ============================
-- 清理旧对象
-- ============================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- ============================
-- 1. Profiles
-- ============================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================
-- 2. Auto-create profile on signup
-- ============================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, nickname)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================
-- 3. Live Activities
-- ============================
CREATE TABLE IF NOT EXISTS live_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_nickname TEXT NOT NULL,
  subject TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE live_activities REPLICA IDENTITY FULL;

-- ============================
-- 4. Study Sessions
-- ============================
CREATE TABLE IF NOT EXISTS study_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, date);

-- ============================
-- 5. Tasks
-- ============================
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);

-- ============================
-- 6. Diet Records
-- ============================
CREATE TABLE IF NOT EXISTS diet_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  food_name TEXT NOT NULL,
  calories INTEGER,
  protein NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diet_records_user_date ON diet_records(user_id, date);

-- ============================
-- 7. Exercise Records
-- ============================
CREATE TABLE IF NOT EXISTS exercise_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_name TEXT NOT NULL,
  weight_kg NUMERIC(5,1),
  reps INTEGER,
  sets INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_records_user_date ON exercise_records(user_id, date);

-- ============================
-- 8. RLS Policies
-- ============================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Live Activities
DROP POLICY IF EXISTS "Users can read all live activities" ON live_activities;
CREATE POLICY "Users can read all live activities" ON live_activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can upsert own live activity" ON live_activities;
CREATE POLICY "Users can upsert own live activity" ON live_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own live activity" ON live_activities;
CREATE POLICY "Users can update own live activity" ON live_activities FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own live activity" ON live_activities;
CREATE POLICY "Users can delete own live activity" ON live_activities FOR DELETE USING (auth.uid() = user_id);

-- Study Sessions
DROP POLICY IF EXISTS "Users can read all study sessions" ON study_sessions;
CREATE POLICY "Users can read all study sessions" ON study_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own study sessions" ON study_sessions;
CREATE POLICY "Users can insert own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own study sessions" ON study_sessions;
CREATE POLICY "Users can update own study sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Tasks
DROP POLICY IF EXISTS "Users can read all tasks" ON tasks;
CREATE POLICY "Users can read all tasks" ON tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Diet Records
DROP POLICY IF EXISTS "Users can read all diet records" ON diet_records;
CREATE POLICY "Users can read all diet records" ON diet_records FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own diet records" ON diet_records;
CREATE POLICY "Users can insert own diet records" ON diet_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own diet records" ON diet_records;
CREATE POLICY "Users can delete own diet records" ON diet_records FOR DELETE USING (auth.uid() = user_id);

-- Exercise Records
DROP POLICY IF EXISTS "Users can read all exercise records" ON exercise_records;
CREATE POLICY "Users can read all exercise records" ON exercise_records FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own exercise records" ON exercise_records;
CREATE POLICY "Users can insert own exercise records" ON exercise_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own exercise records" ON exercise_records;
CREATE POLICY "Users can delete own exercise records" ON exercise_records FOR DELETE USING (auth.uid() = user_id);

-- ============================
-- 9. Storage bucket for avatars
-- ============================
-- Run this in supabase SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow public read access to avatars
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
