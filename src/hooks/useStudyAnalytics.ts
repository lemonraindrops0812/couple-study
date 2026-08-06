import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getToday } from '../lib/date'
import type { StudySession } from '../types'

export interface StudyAnalytics {
  todayMinutes: number; weekMinutes: number; monthMinutes: number
  streakDays: number; maxStreak: number; totalDays90: number; totalMinutes90: number; partnerStreakDays: number
  trendData: { date: string; me: number; partner: number }[]
  trend7Data: { date: string; me: number; partner: number }[]
  heatmapData: { date: string; minutes: number }[]
  partnerHeatmapData: { date: string; minutes: number }[]
  subjectData: { name: string; minutes: number; pct: number }[]
  avgSessionMin: number; bestHour: string; bestPeriod: string; totalSessions: number; maxSessionMin: number; todaySessions: number
  totalGoalMinutes: number; currentTotalMinutes: number; goalPct: number
  combinedDays: number; combinedSessionsWeek: number; bestTogetherStreak: number
  todayTimeline: { id: string; nickname: string; subject: string; time: string; duration: number }[]
}

const GOAL_TOTAL = 2000 * 60

export function useStudyAnalytics(): { data: StudyAnalytics; loading: boolean; deleteSession: (id: string) => Promise<void>; fetchAll: () => Promise<void> } {
  const { user, partner } = useAuth()
  const [data, setData] = useState<StudyAnalytics>({
    todayMinutes: 0, weekMinutes: 0, monthMinutes: 0,
    streakDays: 0, maxStreak: 0, totalDays90: 0, totalMinutes90: 0, partnerStreakDays: 0,
    trendData: [], heatmapData: [], partnerHeatmapData: [], trend7Data: [],
    subjectData: [],
    avgSessionMin: 0, bestHour: '', bestPeriod: '', totalSessions: 0, maxSessionMin: 0, todaySessions: 0,
    totalGoalMinutes: GOAL_TOTAL, currentTotalMinutes: 0, goalPct: 0,
    combinedDays: 0, combinedSessionsWeek: 0, bestTogetherStreak: 0,
    todayTimeline: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const today = getToday()
    const d30 = new Date(); d30.setDate(d30.getDate() - 30)
    const d90 = new Date(); d90.setDate(d90.getDate() - 90)
    const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0] })()

    const d30s = d30.toISOString().split('T')[0]
    const d90s = d90.toISOString().split('T')[0]

    // Helper
    const fetchSessions = (uid: string) => supabase.from('study_sessions').select('*').eq('user_id', uid)

    const [meAll, me30, me90, meMonth, meToday] = await Promise.all([
      fetchSessions(user.id).order('date', { ascending: false }),
      fetchSessions(user.id).gte('date', d30s),
      fetchSessions(user.id).gte('date', d90s),
      fetchSessions(user.id).gte('date', monthStart),
      fetchSessions(user.id).eq('date', today),
    ])

    const mySessions = (meAll.data || []) as StudySession[]
    const my30 = (me30.data || []) as StudySession[]
    const my90 = (me90.data || []) as StudySession[]
    const myMonth = (meMonth.data || []) as StudySession[]
    const myToday = (meToday.data || []) as StudySession[]

    let pSessions: StudySession[] = [], p30: StudySession[] = [], p90: StudySession[] = [], pToday: StudySession[] = []

    if (partner) {
      const [pAll, p30r, p90r, pt] = await Promise.all([
        fetchSessions(partner.id).order('date', { ascending: false }),
        fetchSessions(partner.id).gte('date', d30s),
        fetchSessions(partner.id).gte('date', d90s),
        fetchSessions(partner.id).eq('date', today),
      ])
      pSessions = (pAll.data || []) as StudySession[]
      p30 = (p30r.data || []) as StudySession[]
      p90 = (p90r.data || []) as StudySession[]
      pToday = (pt.data || []) as StudySession[]
    }

    // Overview
    const todayMin = myToday.reduce((s, r) => s + (r.duration_minutes || 0), 0)
    const weekMin = my30.filter((s: StudySession) => s.date >= weekStart).reduce((s: number, r: StudySession) => s + (r.duration_minutes || 0), 0)
    const monthMin = myMonth.reduce((s, r) => s + (r.duration_minutes || 0), 0)

    // Streak
    const daySet = new Set(mySessions.map(s => s.date))
    let streak = 0; const check = new Date()
    while (daySet.has(check.toISOString().split('T')[0])) { streak++; check.setDate(check.getDate() - 1) }
    if (streak === 0 && daySet.has(today)) streak = 1
    let maxSt = 0, cur = 0
    const sortedDays = [...daySet].sort()
    sortedDays.forEach((d, i) => {
      if (i === 0) { cur = 1 } else {
        const prev = new Date(sortedDays[i - 1]); prev.setDate(prev.getDate() + 1)
        if (prev.toISOString().split('T')[0] === d) cur++; else { maxSt = Math.max(maxSt, cur); cur = 1 }
      }
    })
    maxSt = Math.max(maxSt, cur)

    // Partner streak
    const pDaySet = new Set(pSessions.map(s => s.date))
    let pStreak = 0; const pCheck = new Date()
    while (pDaySet.has(pCheck.toISOString().split('T')[0])) { pStreak++; pCheck.setDate(pCheck.getDate() - 1) }
    if (pStreak === 0 && pDaySet.has(today)) pStreak = 1

    // Trend
    const trendData: { date: string; me: number; partner: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); const ds = d.toISOString().split('T')[0]
      trendData.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        me: my30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
        partner: p30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
      })
    }

    // 7-day trend
    const trend7Data: { date: string; me: number; partner: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); const ds = d.toISOString().split('T')[0]
      trend7Data.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        me: my30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
        partner: p30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
      })
    }

    // Heatmap
    const makeHeatmap = (sessions: StudySession[]) => {
      const map: Record<string, number> = {}
      for (let i = 89; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); map[d.toISOString().split('T')[0]] = 0 }
      sessions.forEach(s => { if (map[s.date] !== undefined) map[s.date] += (s.duration_minutes || 0) })
      return Object.entries(map).map(([date, minutes]) => ({ date, minutes }))
    }

    // Subject
    const subMap: Record<string, number> = {}
    myMonth.forEach(s => { subMap[s.subject] = (subMap[s.subject] || 0) + (s.duration_minutes || 0) })
    const totalSubMin = Object.values(subMap).reduce((a, b) => a + b, 0)
    const subjectData = Object.entries(subMap).map(([name, minutes]) => ({
      name, minutes, pct: totalSubMin ? Math.round((minutes / totalSubMin) * 100) : 0,
    })).sort((a, b) => b.minutes - a.minutes)

    // Focus
    const valid = mySessions.filter(s => s.duration_minutes && s.duration_minutes > 0)
    const avgMin = valid.length ? Math.round(valid.reduce((a, s) => a + (s.duration_minutes || 0), 0) / valid.length) : 0
    const maxMin = valid.length ? Math.max(...valid.map(s => s.duration_minutes || 0)) : 0

    const hourCount: Record<number, number> = {}
    for (let h = 0; h < 24; h++) hourCount[h] = 0
    mySessions.forEach(s => { hourCount[new Date(s.start_time).getHours()] += (s.duration_minutes || 0) })
    const bestH = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]
    const bestHour = bestH ? `${bestH[0]}:00-${parseInt(bestH[0]) + 1}:00` : '—'
    const h = parseInt(bestH?.[0] || '0')
    const bestPeriod = h < 6 ? '凌晨' : h < 12 ? '上午' : h < 14 ? '中午' : h < 18 ? '下午' : h < 21 ? '傍晚' : '晚上'

    // Goal
    const allMin = mySessions.reduce((s, r) => s + (r.duration_minutes || 0), 0)
    const goalPct = Math.round((allMin / GOAL_TOTAL) * 1000) / 10

    // Dual
    const pDays = new Set(pSessions.map(s => s.date))
    const bothDays = new Set([...daySet].filter(d => pDays.has(d)))
    const combinedWk = my30.filter(s => s.date >= weekStart && pDays.has(s.date)).length
    let togetherStreak = 0, maxTogether = 0
    for (const d of [...bothDays].sort()) {
      const prev = new Date(d); prev.setDate(prev.getDate() - 1)
      if (bothDays.has(prev.toISOString().split('T')[0])) togetherStreak++
      else { maxTogether = Math.max(maxTogether, togetherStreak); togetherStreak = 1 }
    }
    maxTogether = Math.max(maxTogether, togetherStreak)

    // Timeline
    const timeline = [
      ...myToday.map(s => ({ id: s.id, nickname: user.nickname, subject: s.subject, time: new Date(s.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), duration: s.duration_minutes || 0 })),
      ...pToday.map(s => ({ id: s.id, nickname: partner?.nickname || '对方', subject: s.subject, time: new Date(s.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), duration: s.duration_minutes || 0 })),
    ].sort((a, b) => a.time.localeCompare(b.time))

    setData({
      todayMinutes: todayMin, weekMinutes: weekMin, monthMinutes: monthMin,
      streakDays: streak, maxStreak: maxSt, partnerStreakDays: pStreak,
      totalDays90: daySet.size, totalMinutes90: my90.reduce((s, r) => s + (r.duration_minutes || 0), 0),
      trendData, trend7Data, heatmapData: makeHeatmap(my90), partnerHeatmapData: makeHeatmap(p90),
      subjectData, avgSessionMin: avgMin, bestHour, bestPeriod, totalSessions: mySessions.length, maxSessionMin: maxMin,
      todaySessions: myToday.length,
      totalGoalMinutes: GOAL_TOTAL, currentTotalMinutes: allMin, goalPct,
      combinedDays: bothDays.size, combinedSessionsWeek: combinedWk, bestTogetherStreak: maxTogether,
      todayTimeline: timeline,
    })
    setLoading(false)
  }, [user, partner])

  useEffect(() => { fetchAll() }, [fetchAll])

  const deleteSession = async (id: string) => {
    await supabase.from('study_sessions').delete().eq('id', id)
    fetchAll()
  }

  return { data, loading, deleteSession, fetchAll }
}
