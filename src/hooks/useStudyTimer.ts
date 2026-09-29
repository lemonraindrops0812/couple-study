import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getToday } from '../lib/date'
import { useAuth } from './useAuth'
import type { StudySession } from '../types'

interface TimerState {
  kind: 'study_timer_v1'
  nickname: string
  sessionStartedAt: string
  accumulatedSeconds: number
  activeSegmentStartedAt: string | null
  paused: boolean
}

function notifyActivityChanged() {
  window.dispatchEvent(new Event('couple-study:activity-changed'))
}

function readTimerState(value: string | null | undefined): TimerState | null {
  if (!value) return null
  try {
    const state = JSON.parse(value) as TimerState
    if (state.kind !== 'study_timer_v1' || !state.sessionStartedAt) return null
    return {
      ...state,
      accumulatedSeconds: Math.max(0, Math.floor(Number(state.accumulatedSeconds) || 0)),
      activeSegmentStartedAt: state.activeSegmentStartedAt || null,
      paused: Boolean(state.paused),
    }
  } catch {
    return null
  }
}

export function useStudyTimer() {
  const { user } = useAuth()
  const [isStudying, setIsStudying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [subject, setSubject] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [timerError, setTimerError] = useState<string | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  const [isPauseChanging, setIsPauseChanging] = useState(false)
  const sessionStartRef = useRef<Date | null>(null)
  const activeSegmentStartRef = useRef<Date | null>(null)
  const accumulatedSecondsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopInFlightRef = useRef(false)
  const pauseChangeInFlightRef = useRef(false)

  const stopTicking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  const getActiveElapsedSeconds = useCallback((now = Date.now()) => {
    const activeStart = activeSegmentStartRef.current
    const activeSeconds = activeStart ? Math.max(0, Math.floor((now - activeStart.getTime()) / 1000)) : 0
    return accumulatedSecondsRef.current + activeSeconds
  }, [])

  const startTicking = useCallback(() => {
    stopTicking()
    const tick = () => setElapsed(getActiveElapsedSeconds())
    tick()
    intervalRef.current = setInterval(tick, 1000)
  }, [getActiveElapsedSeconds, stopTicking])

  const makeTimerState = useCallback((paused: boolean): TimerState | null => {
    if (!user || !sessionStartRef.current) return null
    return {
      kind: 'study_timer_v1',
      nickname: user.nickname,
      sessionStartedAt: sessionStartRef.current.toISOString(),
      accumulatedSeconds: accumulatedSecondsRef.current,
      activeSegmentStartedAt: paused ? null : activeSegmentStartRef.current?.toISOString() || null,
      paused,
    }
  }, [user])

  // The live row contains the resume information, so both an active and a
  // paused timer survive a page refresh without creating a study record.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const restoreTimer = async () => {
      const { data, error } = await supabase
        .from('live_activities')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled || !data) {
        if (error) setTimerError(`无法恢复计时：${error.message}`)
        return
      }

      const state = readTimerState(data.user_nickname)
      // Old inactive rows are only a fallback after a completed session, not
      // a paused study session that should be restored.
      if (!data.is_active && !state?.paused) return

      const sessionStart = new Date(state?.sessionStartedAt || data.start_time)
      const activeSegmentStart = state?.activeSegmentStartedAt
        ? new Date(state.activeSegmentStartedAt)
        : new Date(data.start_time)
      sessionStartRef.current = sessionStart
      accumulatedSecondsRef.current = state?.accumulatedSeconds || 0
      activeSegmentStartRef.current = data.is_active ? activeSegmentStart : null
      setSubject(data.subject)
      setStartTime(sessionStart)
      setIsStudying(true)
      setIsPaused(!data.is_active)

      if (data.is_active) startTicking()
      else setElapsed(accumulatedSecondsRef.current)
    }
    void restoreTimer()
    return () => {
      cancelled = true
      stopTicking()
    }
  }, [startTicking, stopTicking, user?.id])

  const startStudy = useCallback(async (subjectName: string) => {
    if (!user || sessionStartRef.current || stopInFlightRef.current || pauseChangeInFlightRef.current) return false
    setTimerError(null)
    const now = new Date()
    const initialState: TimerState = {
      kind: 'study_timer_v1',
      nickname: user.nickname,
      sessionStartedAt: now.toISOString(),
      accumulatedSeconds: 0,
      activeSegmentStartedAt: now.toISOString(),
      paused: false,
    }
    const { error } = await supabase.from('live_activities').upsert({
      user_id: user.id,
      user_nickname: JSON.stringify(initialState),
      subject: subjectName,
      start_time: now.toISOString(),
      is_active: true,
    }, { onConflict: 'user_id' })
    if (error) {
      setTimerError(`无法开始计时：${error.message}`)
      return false
    }

    sessionStartRef.current = now
    activeSegmentStartRef.current = now
    accumulatedSecondsRef.current = 0
    setSubject(subjectName)
    setStartTime(now)
    setElapsed(0)
    setIsPaused(false)
    setIsStudying(true)
    startTicking()
    notifyActivityChanged()
    return true
  }, [startTicking, user])

  const pauseStudy = useCallback(async () => {
    if (!user || !sessionStartRef.current || isPaused || pauseChangeInFlightRef.current || stopInFlightRef.current) return false
    pauseChangeInFlightRef.current = true
    setIsPauseChanging(true)
    setTimerError(null)

    const activeStart = activeSegmentStartRef.current
    const accumulatedBeforePause = accumulatedSecondsRef.current
    const totalSeconds = getActiveElapsedSeconds()
    accumulatedSecondsRef.current = totalSeconds
    activeSegmentStartRef.current = null
    const nextState = makeTimerState(true)
    if (!nextState) {
      accumulatedSecondsRef.current = accumulatedBeforePause
      activeSegmentStartRef.current = activeStart
      pauseChangeInFlightRef.current = false
      setIsPauseChanging(false)
      return false
    }
    const effectiveStart = new Date(Date.now() - totalSeconds * 1000)
    const { error } = await supabase
      .from('live_activities')
      .update({ is_active: false, start_time: effectiveStart.toISOString(), user_nickname: JSON.stringify(nextState) })
      .eq('user_id', user.id)

    pauseChangeInFlightRef.current = false
    setIsPauseChanging(false)
    if (error) {
      activeSegmentStartRef.current = activeStart
      accumulatedSecondsRef.current = accumulatedBeforePause
      setTimerError(`暂停失败：${error.message}`)
      return false
    }

    stopTicking()
    setElapsed(totalSeconds)
    setIsPaused(true)
    notifyActivityChanged()
    return true
  }, [getActiveElapsedSeconds, isPaused, makeTimerState, stopTicking, user])

  const resumeStudy = useCallback(async () => {
    if (!user || !sessionStartRef.current || !isPaused || pauseChangeInFlightRef.current || stopInFlightRef.current) return false
    pauseChangeInFlightRef.current = true
    setIsPauseChanging(true)
    setTimerError(null)

    const now = new Date()
    activeSegmentStartRef.current = now
    const nextState = makeTimerState(false)
    if (!nextState) {
      activeSegmentStartRef.current = null
      pauseChangeInFlightRef.current = false
      setIsPauseChanging(false)
      return false
    }
    const effectiveStart = new Date(now.getTime() - accumulatedSecondsRef.current * 1000)
    const { error } = await supabase
      .from('live_activities')
      .update({ is_active: true, start_time: effectiveStart.toISOString(), user_nickname: JSON.stringify(nextState) })
      .eq('user_id', user.id)

    pauseChangeInFlightRef.current = false
    setIsPauseChanging(false)
    if (error) {
      activeSegmentStartRef.current = null
      setTimerError(`继续失败：${error.message}`)
      return false
    }

    setIsPaused(false)
    startTicking()
    notifyActivityChanged()
    return true
  }, [isPaused, makeTimerState, startTicking, user])

  const stopStudy = useCallback(async (): Promise<StudySession | null> => {
    if (!user || !sessionStartRef.current || stopInFlightRef.current || pauseChangeInFlightRef.current) return null
    stopInFlightRef.current = true
    setIsStopping(true)
    setTimerError(null)
    const start = sessionStartRef.current
    const end = new Date()
    const totalSeconds = isPaused ? accumulatedSecondsRef.current : getActiveElapsedSeconds(end.getTime())
    const duration = Math.max(1, Math.round(totalSeconds / 60))
    const { data, error } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: duration,
      date: getToday(),
    }).select().single()
    if (error) {
      setTimerError(`学习记录保存失败：${error.message}`)
      stopInFlightRef.current = false
      setIsStopping(false)
      return null
    }

    const { error: activityError } = await supabase.from('live_activities').delete().eq('user_id', user.id)
    if (activityError) {
      const { error: deactivateError } = await supabase
        .from('live_activities')
        .update({ is_active: false })
        .eq('user_id', user.id)
      if (deactivateError) setTimerError('学习记录已保存，但实时状态暂未同步。重新开始学习会自动恢复。')
    }

    sessionStartRef.current = null
    activeSegmentStartRef.current = null
    accumulatedSecondsRef.current = 0
    stopInFlightRef.current = false
    setIsStopping(false)
    setIsPaused(false)
    setIsStudying(false)
    stopTicking()
    notifyActivityChanged()
    return data as StudySession
  }, [getActiveElapsedSeconds, isPaused, stopTicking, subject, user])

  const formatElapsed = () => {
    const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    isStudying,
    isPaused,
    isStopping,
    isPauseChanging,
    subject,
    startTime,
    elapsed,
    timerError,
    formatElapsed,
    startStudy,
    pauseStudy,
    resumeStudy,
    stopStudy,
  }
}
