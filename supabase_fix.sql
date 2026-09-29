-- Couple Study Dashboard: safe follow-up migration
-- Run this once in Supabase Dashboard → SQL Editor.
-- It only adds missing columns/policies and does not delete your records.

BEGIN;

-- Fields already used by the task and diet screens.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '其他',
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;

ALTER TABLE public.diet_records
  ADD COLUMN IF NOT EXISTS carbs NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS fat NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS weight_g NUMERIC(7,1);

-- Optional learning notes shown after ending a study timer.
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS study_summary TEXT,
  ADD COLUMN IF NOT EXISTS study_reflection TEXT;

ALTER TABLE public.diet_records
  DROP CONSTRAINT IF EXISTS diet_records_meal_type_check;
ALTER TABLE public.diet_records
  ADD CONSTRAINT diet_records_meal_type_check
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));

-- The dashboard has a delete action for its own study records.
DROP POLICY IF EXISTS "Users can delete own study sessions" ON public.study_sessions;
CREATE POLICY "Users can delete own study sessions"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Make the profile update rule explicit for both the existing and new row.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Avatar upload now uses: <auth user id>/avatar.<extension>.
-- The prior insert-only policy made replacement uploads fail because `upsert`
-- requires UPDATE permission too.
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "allow_all_avatars" ON storage.objects;

CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Keep both dashboards in sync when a record, task, avatar or mood changes.
-- `duplicate_object` is ignored when the table is already in the publication.
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.study_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.diet_records REPLICA IDENTITY FULL;
ALTER TABLE public.exercise_records REPLICA IDENTITY FULL;
ALTER TABLE public.mood_entries REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.diet_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_entries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
