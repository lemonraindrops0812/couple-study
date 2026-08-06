import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { StudySession, Task, DietRecord, ExerciseRecord, DashboardData } from '../types'

const today = new Date().toISOString().split('T')[0]

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function getWeekStart(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}

function computeStreak(sessions: StudySession[]): number {
  if (!sessions.length) return 0
  const days = new Set(sessions.map(s => s.date))
  let streak = 0
  const d = new Date()
  while (days.has(d.toISOString().split('T')[0])) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  // Also check today
  if (streak === 0) {
    const todayStr = new Date().toISOString().split('T')[0]
    if (days.has(todayStr)) streak = 1
  }
  return streak
}

export function useDashboard(): { data: DashboardData; loading: boolean } {
  const { user, partner } = useAuth()
  const [data, setData] = useState<DashboardData>({
    todayStudyMinutes: 0, todayStudyCount: 0, yesterdayStudyMinutes: 0,
    todayTasksDone: 0, todayTasksTotal: 0,
    dietCalories: 0, dietProtein: 0, dietCarbs: 0, dietFat: 0,
    exerciseMinutes: 0, exerciseCount: 0,
    streakDays: 0, partnerStreakDays: 0,
    subjectBreakdown: [], hourlyData: [], partnerHourlyData: [], weeklyCombined: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const yesterday = getYesterday()
    const weekStart = getWeekStart()

    const [
      { data: todaySessions },
      { data: yesterdaySessions },
      { data: allMySessions },
      { data: allPartnerSessions },
      { data: tasks },
      { data: diet },
      { data: exercise },
    ] = await Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).eq('date', yesterday),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      partner ? supabase.from('study_sessions').select('*').eq('user_id', partner.id).order('date', { ascending: false }) : Promise.resolve({ data: [] }),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('diet_records').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('exercise_records').select('*').eq('user_id', user.id).eq('date', today),
    ])

    const todayStudy = (todaySessions as StudySession[]) || []
    const yesterdayStudy = (yesterdaySessions as StudySession[]) || []
    const mySessions = (allMySessions as StudySession[]) || []
    const partnerSessions = (allPartnerSessions as StudySession[]) || []
    const todayTasks = (tasks as Task[]) || []
    const todayDiet = (diet as DietRecord[]) || []
    const todayExercise = (exercise as ExerciseRecord[]) || []

    // Subject breakdown
    const breakdownMap: Record<string, number> = {}
    todayStudy.forEach(s => {
      breakdownMap[s.subject] = (breakdownMap[s.subject] || 0) + (s.duration_minutes || 0)
    })

    // Hourly data
    const hourlyMap: Record<number, number> = {}
    const partnerHourlyMap: Record<number, number> = {}
    for (let i = 0; i < 24; i++) { hourlyMap[i] = 0; partnerHourlyMap[i] = 0 }
    todayStudy.forEach(s => {
      const h = new Date(s.start_time).getHours()
      hourlyMap[h] = (hourlyMap[h] || 0) + (s.duration_minutes || 0)
    })
    if (partner) {
      const { data: ptSessions } = await supabase.from('study_sessions').select('*').eq('user_id', partner.id).eq('date', today)
      ;(ptSessions as StudySession[])?.forEach(s => {
        const h = new Date(s.start_time).getHours()
        partnerHourlyMap[h] = (partnerHourlyMap[h] || 0) + (s.duration_minutes || 0)
      })
    }

    // Weekly combined (last 7 days)
    const weeklyMap: Record<string, { sessions: number; tasks: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      weeklyMap[key] = { sessions: 0, tasks: 0 }
    }
    const { data: weekSessions } = await supabase.from('study_sessions').select('*').gte('date', weekStart)
    const { data: weekTasks } = await supabase.from('tasks').select('*').gte('date', weekStart)
    ;(weekSessions as StudySession[])?.forEach(s => { if (weeklyMap[s.date]) weeklyMap[s.date].sessions++ })
    ;(weekTasks as Task[])?.forEach(t => { if (weeklyMap[t.date]) weeklyMap[t.date].tasks++ })

    setData({
      todayStudyMinutes: todayStudy.reduce((s, r) => s + (r.duration_minutes || 0), 0),
      todayStudyCount: todayStudy.length,
      yesterdayStudyMinutes: yesterdayStudy.reduce((s, r) => s + (r.duration_minutes || 0), 0),
      todayTasksDone: todayTasks.filter(t => t.completed).length,
      todayTasksTotal: todayTasks.length,
      dietCalories: todayDiet.reduce((s, r) => s + (r.calories || 0), 0),
      dietProtein: todayDiet.reduce((s, r) => s + (r.protein || 0), 0),
      dietCarbs: todayDiet.reduce((s, r) => s + (r.carbs || 0), 0),
      dietFat: todayDiet.reduce((s, r) => s + (r.fat || 0), 0),
      exerciseMinutes: todayExercise.reduce((s, r) => s + (r.duration_minutes || 0), 0),
      exerciseCount: todayExercise.length,
      streakDays: computeStreak(mySessions),
      partnerStreakDays: computeStreak(partnerSessions),
      subjectBreakdown: Object.entries(breakdownMap).map(([name, minutes]) => ({ name, minutes })),
      hourlyData: Object.entries(hourlyMap).map(([h, m]) => ({ hour: `${h}时`, minutes: m })),
      partnerHourlyData: Object.entries(partnerHourlyMap).map(([h, m]) => ({ hour: `${h}时`, minutes: m })),
      weeklyCombined: Object.entries(weeklyMap).map(([day, v]) => ({
        day: day.slice(5),
        sessions: v.sessions,
        tasks: v.tasks,
      })),
    })
    setLoading(false)
  }, [user, partner])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { data, loading }
}
