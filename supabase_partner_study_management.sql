-- Couple Study Dashboard: partner study management
-- Run once in Supabase Dashboard → SQL Editor.
-- This enables each of the app's two members to edit the other's completed
-- study records and to end the other's running timer safely.

BEGIN;

-- The app is deliberately a two-person dashboard.  These functions refuse
-- to run if a third profile is ever added, rather than granting access to an
-- unrelated account.
CREATE OR REPLACE FUNCTION public.is_only_partner(p_partner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL
    AND p_partner_id IS NOT NULL
    AND p_partner_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = p_partner_id)
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id <> auth.uid()
        AND id <> p_partner_id
    );
END;
$$;

-- Update only the start/end times of a completed partner record.  The
-- function does not expose user_id or any unrelated fields for changes.
CREATE OR REPLACE FUNCTION public.update_partner_study_session(
  p_session_id BIGINT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS public.study_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.study_sessions;
  v_duration_minutes INTEGER;
  v_study_date DATE;
BEGIN
  SELECT * INTO v_session
  FROM public.study_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '未找到这条学习记录。';
  END IF;
  IF v_session.end_time IS NULL THEN
    RAISE EXCEPTION '正在计时的学习不能修改时间，请使用结束计时。';
  END IF;
  IF p_start_time IS NULL OR p_end_time IS NULL OR p_end_time <= p_start_time THEN
    RAISE EXCEPTION '结束时间需要晚于开始时间。';
  END IF;
  IF v_session.user_id <> auth.uid() AND NOT public.is_only_partner(v_session.user_id) THEN
    RAISE EXCEPTION '你没有权限修改这条学习记录。';
  END IF;

  v_duration_minutes := GREATEST(1, ROUND(EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60.0)::INTEGER);
  -- Keep the product's 02:00-to-02:00 study-day convention in China time.
  v_study_date := ((p_start_time AT TIME ZONE 'Asia/Shanghai') - INTERVAL '2 hours')::DATE;

  UPDATE public.study_sessions
  SET start_time = p_start_time,
      end_time = p_end_time,
      duration_minutes = v_duration_minutes,
      date = v_study_date
  WHERE id = v_session.id
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$;

-- Atomically end the partner's timer and create exactly one completed record.
-- It understands the app's pause/resume state stored in user_nickname, while
-- retaining a safe fallback for any timer created by an older version.
CREATE OR REPLACE FUNCTION public.force_end_partner_study(p_partner_id UUID)
RETURNS public.study_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity public.live_activities;
  v_session public.study_sessions;
  v_state JSONB := '{}'::JSONB;
  v_start_time TIMESTAMPTZ;
  v_active_segment_start TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ := now();
  v_accumulated_seconds NUMERIC := 0;
  v_total_seconds NUMERIC;
  v_is_paused BOOLEAN := FALSE;
  v_duration_minutes INTEGER;
  v_study_date DATE;
BEGIN
  IF NOT public.is_only_partner(p_partner_id) THEN
    RAISE EXCEPTION '你没有权限结束这位用户的计时。';
  END IF;

  SELECT * INTO v_activity
  FROM public.live_activities
  WHERE user_id = p_partner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '对方当前没有进行中的计时。';
  END IF;

  BEGIN
    v_state := v_activity.user_nickname::JSONB;
  EXCEPTION WHEN others THEN
    v_state := '{}'::JSONB;
  END;

  IF v_state ->> 'kind' = 'study_timer_v1' THEN
    BEGIN
      v_start_time := COALESCE(NULLIF(v_state ->> 'sessionStartedAt', '')::TIMESTAMPTZ, v_activity.start_time);
      v_active_segment_start := COALESCE(NULLIF(v_state ->> 'activeSegmentStartedAt', '')::TIMESTAMPTZ, v_activity.start_time);
      v_accumulated_seconds := GREATEST(0, COALESCE(NULLIF(v_state ->> 'accumulatedSeconds', '')::NUMERIC, 0));
      v_is_paused := COALESCE(NULLIF(v_state ->> 'paused', '')::BOOLEAN, FALSE);
    EXCEPTION WHEN others THEN
      v_start_time := v_activity.start_time;
      v_active_segment_start := v_activity.start_time;
      v_accumulated_seconds := 0;
      v_is_paused := FALSE;
    END;
  ELSE
    v_start_time := v_activity.start_time;
    v_active_segment_start := v_activity.start_time;
  END IF;

  v_total_seconds := v_accumulated_seconds;
  IF NOT v_is_paused THEN
    v_total_seconds := v_total_seconds + GREATEST(0, EXTRACT(EPOCH FROM (v_end_time - v_active_segment_start)));
  END IF;
  v_duration_minutes := GREATEST(1, ROUND(v_total_seconds / 60.0)::INTEGER);
  v_study_date := ((v_start_time AT TIME ZONE 'Asia/Shanghai') - INTERVAL '2 hours')::DATE;

  INSERT INTO public.study_sessions (
    user_id, subject, start_time, end_time, duration_minutes, date
  ) VALUES (
    p_partner_id, v_activity.subject, v_start_time, v_end_time, v_duration_minutes, v_study_date
  )
  RETURNING * INTO v_session;

  DELETE FROM public.live_activities WHERE id = v_activity.id;
  RETURN v_session;
END;
$$;

REVOKE ALL ON FUNCTION public.is_only_partner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_partner_study_session(BIGINT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.force_end_partner_study(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_partner_study_session(BIGINT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_end_partner_study(UUID) TO authenticated;

COMMIT;
