import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getToday } from '../lib/date'
import { useAuth } from './useAuth'
import type { StudySession } from '../types'

export function useStudyTimer() {
  const { user } = useAuth()
  const [isStudying, setIsStudying] = useState(false)
  const [subject, setSubject] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<Date | null>(null)

  // Auto-resume from live_activities on mount
  useEffect(() => {
    if (!user) return
    supabase.from('live_activities').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle()
      .then(({ data }) => {
        if (!data) return
        const start = new Date(data.start_time)
        setSubject(data.subject)
        setStartTime(start)
        startRef.current = start
        setIsStudying(true)
        setElapsed(Math.floor((Date.now() - start.getTime()) / 1000))
        const int = setInterval(() => setElapsed(p => p + 1), 1000)
        setTimerInterval(int)
      })
    return () => {}
  }, [user?.id]) // only on user change, not every render

  // Save partial session on page close (navigator.sendBeacon)
  useEffect(() => {
    if (!isStudying || !user || !startRef.current) return
    const save = () => {
      const end = new Date()
      const dur = Math.round((end.getTime() - startRef.current!.getTime()) / 60000)
      if (dur < 1) return
      // Use REST directly for reliability on unload
      const base = 'https://pfhcqmjagyshyesnlipb.supabase.co/rest/v1'
      const body = JSON.stringify({
        user_id: user.id, subject,
        start_time: startRef.current!.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: dur,
        date: getToday(),
      })
      navigator.sendBeacon(`${base}/study_sessions`, new Blob([body], { type: 'application/json' }))
      // Can't use beacon for DELETE, but live_activity will be cleaned next time user starts or on login
    }
    window.addEventListener('beforeunload', save)
    return () => window.removeEventListener('beforeunload', save)
  }, [isStudying, user, subject])

  const startStudy = useCallback(async (subjectName: string) => {
    if (!user) return
    setSubject(subjectName)
    const now = new Date()
    startRef.current = now
    setStartTime(now)
    setIsStudying(true)
    setElapsed(0)
    await supabase.from('live_activities').upsert({
      user_id: user.id, user_nickname: user.nickname,
      subject: subjectName, start_time: now.toISOString(), is_active: true,
    }, { onConflict: 'user_id' })
    const int = setInterval(() => setElapsed(p => p + 1), 1000)
    setTimerInterval(int)
  }, [user])

  const stopStudy = useCallback(async (): Promise<StudySession | null> => {
    if (!user || !startRef.current) return null
    startRef.current = null // prevent beforeunload double-save
    const end = new Date()
    const dur = Math.round((end.getTime() - startTime!.getTime()) / 60000)
    setIsStudying(false)
    if (timerInterval) clearInterval(timerInterval)
    setTimerInterval(null)
    await supabase.from('live_activities').delete().eq('user_id', user.id)
    const { data } = await supabase.from('study_sessions').insert({
      user_id: user.id, subject,
      start_time: startTime!.toISOString(), end_time: end.toISOString(),
      duration_minutes: dur, date: getToday(),
    }).select().single()
    return data as StudySession
  }, [user, startTime, subject, timerInterval])

  const formatElapsed = () => {
    const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return { isStudying, subject, startTime, elapsed, formatElapsed, startStudy, stopStudy }
}
