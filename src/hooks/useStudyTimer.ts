import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { StudySession } from '../types'

export function useStudyTimer() {
  const { user } = useAuth()
  const [isStudying, setIsStudying] = useState(false)
  const [subject, setSubject] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null)

  const startStudy = useCallback(async (subjectName: string) => {
    if (!user) return
    setSubject(subjectName)
    const now = new Date()
    setStartTime(now)
    setIsStudying(true)
    setElapsed(0)

    // Create live activity for partner to see
    await supabase.from('live_activities').upsert({
      user_id: user.id,
      user_nickname: user.nickname,
      subject: subjectName,
      start_time: now.toISOString(),
      is_active: true,
    }, { onConflict: 'user_id' })

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
    setTimerInterval(interval)
  }, [user])

  const stopStudy = useCallback(async (): Promise<StudySession | null> => {
    if (!user || !startTime) return null
    const endTime = new Date()
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    setIsStudying(false)
    if (timerInterval) clearInterval(timerInterval)
    setTimerInterval(null)

    // Remove live activity
    await supabase.from('live_activities').delete().eq('user_id', user.id)

    // Save study session
    const { data } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      date: startTime.toISOString().split('T')[0],
    }).select().single()

    return data as StudySession
  }, [user, startTime, subject, timerInterval])

  const formatElapsed = () => {
    const h = Math.floor(elapsed / 3600)
    const m = Math.floor((elapsed % 3600) / 60)
    const s = elapsed % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return { isStudying, subject, startTime, elapsed, formatElapsed, startStudy, stopStudy }
}
