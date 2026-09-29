import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { formatDateKey, getDateOffset, getToday, getWeekStart, shiftDateKey } from '../lib/date'
import type { StudySession } from '../types'

export interface StudyAnalytics {
  todayMinutes: number; weekMinutes: number; monthMinutes: number
  partnerTodayMinutes: number; partnerWeekMinutes: number; partnerMonthMinutes: number
  streakDays: number; maxStreak: number; totalDays90: number; totalMinutes90: number; partnerStreakDays: number; partnerMaxStreak: number; partnerTotalDays90: number; partnerTotalMinutes90: number
  trendData: { date: string; me: number; partner: number }[]
  trend7Data: { date: string; me: number; partner: number }[]
  todayTrendData: { date: string; me: number; partner: number }[]
  heatmapData: { date: string; minutes: number }[]
  partnerHeatmapData: { date: string; minutes: number }[]
  subjectData: { name: string; minutes: number; pct: number }[]
  todaySubjectData: { name: string; minutes: number; pct: number }[]
  partnerSubjectData: { name: string; minutes: number; pct: number }[]
  partnerTodaySubjectData: { name: string; minutes: number; pct: number }[]
  avgSessionMin: number; bestHour: string; bestPeriod: string; totalSessions: number; maxSessionMin: number; todaySessions: number
  partnerAvgSessionMin: number; partnerBestHour: string; partnerBestPeriod: string; partnerTotalSessions: number; partnerMaxSessionMin: number; partnerTodaySessions: number
  totalGoalMinutes: number; currentTotalMinutes: number; goalPct: number; partnerCurrentTotalMinutes: number; partnerGoalPct: number
  combinedDays: number; combinedSessionsWeek: number; bestTogetherStreak: number
  todayTimeline: (StudySession & { nickname: string })[]
}

const GOAL_TOTAL = 2000 * 60

export function useStudyAnalytics(selectedDate = getToday()): { data: StudyAnalytics; loading: boolean; deleteSession: (id: string) => Promise<void>; fetchAll: () => Promise<void> } {
  const { user, partner } = useAuth()
  const [data, setData] = useState<StudyAnalytics>({
    todayMinutes: 0, weekMinutes: 0, monthMinutes: 0,
    partnerTodayMinutes: 0, partnerWeekMinutes: 0, partnerMonthMinutes: 0,
    streakDays: 0, maxStreak: 0, totalDays90: 0, totalMinutes90: 0, partnerStreakDays: 0, partnerMaxStreak: 0, partnerTotalDays90: 0, partnerTotalMinutes90: 0,
    trendData: [], heatmapData: [], partnerHeatmapData: [], trend7Data: [], todayTrendData: [],
    subjectData: [], todaySubjectData: [], partnerSubjectData: [], partnerTodaySubjectData: [],
    avgSessionMin: 0, bestHour: '', bestPeriod: '', totalSessions: 0, maxSessionMin: 0, todaySessions: 0,
    partnerAvgSessionMin: 0, partnerBestHour: '', partnerBestPeriod: '', partnerTotalSessions: 0, partnerMaxSessionMin: 0, partnerTodaySessions: 0,
    totalGoalMinutes: GOAL_TOTAL, currentTotalMinutes: 0, goalPct: 0, partnerCurrentTotalMinutes: 0, partnerGoalPct: 0,
    combinedDays: 0, combinedSessionsWeek: 0, bestTogetherStreak: 0,
    todayTimeline: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const today = selectedDate
    const logicalNow = new Date(`${today}T12:00:00`)
    const monthStart = formatDateKey(new Date(logicalNow.getFullYear(), logicalNow.getMonth(), 1))
    const weekStart = getWeekStart(logicalNow)
    const d30s = getDateOffset(-30, logicalNow)
    const d90s = getDateOffset(-90, logicalNow)

    // Helper
    const fetchSessions = (uid: string) => supabase.from('study_sessions').select('*').eq('user_id', uid)

    const [meAll, me30, me90, meMonth, meToday] = await Promise.all([
      fetchSessions(user.id).order('date', { ascending: false }),
      fetchSessions(user.id).gte('date', d30s).lte('date', today),
      fetchSessions(user.id).gte('date', d90s).lte('date', today),
      fetchSessions(user.id).gte('date', monthStart).lte('date', today),
      fetchSessions(user.id).eq('date', today),
    ])

    const mySessions = ((meAll.data || []) as StudySession[]).filter(session => session.date <= today)
    const my30 = (me30.data || []) as StudySession[]
    const my90 = (me90.data || []) as StudySession[]
    const myMonth = (meMonth.data || []) as StudySession[]
    const myToday = (meToday.data || []) as StudySession[]

    let pSessions: StudySession[] = [], p30: StudySession[] = [], p90: StudySession[] = [], pMonth: StudySession[] = [], pToday: StudySession[] = []

    if (partner) {
      const [pAll, p30r, p90r, pm, pt] = await Promise.all([
        fetchSessions(partner.id).order('date', { ascending: false }),
        fetchSessions(partner.id).gte('date', d30s).lte('date', today),
        fetchSessions(partner.id).gte('date', d90s).lte('date', today),
        fetchSessions(partner.id).gte('date', monthStart).lte('date', today),
        fetchSessions(partner.id).eq('date', today),
      ])
      pSessions = ((pAll.data || []) as StudySession[]).filter(session => session.date <= today)
      p30 = (p30r.data || []) as StudySession[]
      p90 = (p90r.data || []) as StudySession[]
      pMonth = (pm.data || []) as StudySession[]
      pToday = (pt.data || []) as StudySession[]
    }

    // Overview
    const todayMin = myToday.reduce((s, r) => s + (r.duration_minutes || 0), 0)
    const weekMin = my30.filter((s: StudySession) => s.date >= weekStart).reduce((s: number, r: StudySession) => s + (r.duration_minutes || 0), 0)
    const monthMin = myMonth.reduce((s, r) => s + (r.duration_minutes || 0), 0)
    const partnerTodayMin = pToday.reduce((s, r) => s + (r.duration_minutes || 0), 0)
    const partnerWeekMin = p30.filter((s: StudySession) => s.date >= weekStart).reduce((s: number, r: StudySession) => s + (r.duration_minutes || 0), 0)
    const partnerMonthMin = pMonth.reduce((s, r) => s + (r.duration_minutes || 0), 0)

    // Streak
    const daySet = new Set(mySessions.filter(s => s.date <= today).map(s => s.date))
    let streak = 0
    while (daySet.has(getDateOffset(-streak, logicalNow))) streak++
    let maxSt = 0, cur = 0
    const sortedDays = [...daySet].sort()
    sortedDays.forEach((d, i) => {
      if (i === 0) { cur = 1 } else {
        if (shiftDateKey(sortedDays[i - 1], 1) === d) cur++; else { maxSt = Math.max(maxSt, cur); cur = 1 }
      }
    })
    maxSt = Math.max(maxSt, cur)

    // Partner streak
    const pDaySet = new Set(pSessions.filter(s => s.date <= today).map(s => s.date))
    let pStreak = 0
    while (pDaySet.has(getDateOffset(-pStreak, logicalNow))) pStreak++
    let pMaxStreak = 0, pCurrentStreak = 0
    const sortedPartnerDays = [...pDaySet].sort()
    sortedPartnerDays.forEach((day, index) => {
      if (index === 0) pCurrentStreak = 1
      else if (shiftDateKey(sortedPartnerDays[index - 1], 1) === day) pCurrentStreak++
      else {
        pMaxStreak = Math.max(pMaxStreak, pCurrentStreak)
        pCurrentStreak = 1
      }
    })
    pMaxStreak = Math.max(pMaxStreak, pCurrentStreak)

    // Trend
    const trendData: { date: string; me: number; partner: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const ds = getDateOffset(-i, logicalNow)
      const d = new Date(`${ds}T12:00:00`)
      trendData.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        me: my30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
        partner: p30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
      })
    }

    // 7-day trend
    const trend7Data: { date: string; me: number; partner: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const ds = getDateOffset(-i, logicalNow)
      const d = new Date(`${ds}T12:00:00`)
      trend7Data.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        me: my30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
        partner: p30.filter(s => s.date === ds).reduce((a, r) => a + (r.duration_minutes || 0), 0),
      })
    }

    // The study day runs from 02:00 to 02:00. Keep one column per actual
    // clock hour, and split a session across every hour it spans instead of
    // placing its whole duration in the hour when it began.
    const todayTrendData = Array.from({ length: 24 }, (_, index) => {
      const startHour = (index + 2) % 24
      return { date: `${String(startHour).padStart(2, '0')}:00`, me: 0, partner: 0 }
    })
    const studyDayStart = new Date(logicalNow)
    studyDayStart.setHours(2, 0, 0, 0)
    const studyDayEnd = new Date(studyDayStart)
    studyDayEnd.setDate(studyDayEnd.getDate() + 1)

    const addToTodayTrend = (sessions: StudySession[], key: 'me' | 'partner') => {
      sessions.forEach(session => {
        const start = new Date(session.start_time)
        const savedEnd = session.end_time ? new Date(session.end_time) : null
        const end = savedEnd && savedEnd > start
          ? savedEnd
          : new Date(start.getTime() + (session.duration_minutes || 0) * 60_000)
        let segmentStart = new Date(Math.max(start.getTime(), studyDayStart.getTime()))
        const segmentEnd = new Date(Math.min(end.getTime(), studyDayEnd.getTime()))

        while (segmentStart < segmentEnd) {
          const hourStart = new Date(segmentStart)
          hourStart.setMinutes(0, 0, 0)
          const nextHour = new Date(hourStart)
          nextHour.setHours(nextHour.getHours() + 1)
          const pieceEnd = new Date(Math.min(nextHour.getTime(), segmentEnd.getTime()))
          const logicalHour = hourStart.getHours() < 2 ? hourStart.getHours() + 24 : hourStart.getHours()
          const bucket = logicalHour - 2
          if (bucket >= 0 && bucket < todayTrendData.length) {
            todayTrendData[bucket][key] += (pieceEnd.getTime() - segmentStart.getTime()) / 60_000
          }
          segmentStart = pieceEnd
        }
      })
    }
    addToTodayTrend(myToday, 'me')
    addToTodayTrend(pToday, 'partner')

    // Heatmap
    const makeHeatmap = (sessions: StudySession[]) => {
      const map: Record<string, number> = {}
      for (let i = 89; i >= 0; i--) map[getDateOffset(-i, logicalNow)] = 0
      sessions.forEach(s => { if (map[s.date] !== undefined) map[s.date] += (s.duration_minutes || 0) })
      return Object.entries(map).map(([date, minutes]) => ({ date, minutes }))
    }

    // Subject composition for both the selected month and the current day.
    const makeSubjectData = (sessions: StudySession[]) => {
      const subMap: Record<string, number> = {}
      sessions.forEach(s => { subMap[s.subject] = (subMap[s.subject] || 0) + (s.duration_minutes || 0) })
      const totalSubMin = Object.values(subMap).reduce((a, b) => a + b, 0)
      return Object.entries(subMap).map(([name, minutes]) => ({
        name, minutes, pct: totalSubMin ? Math.round((minutes / totalSubMin) * 100) : 0,
      })).sort((a, b) => b.minutes - a.minutes)
    }
    const subjectData = makeSubjectData(myMonth)
    const todaySubjectData = makeSubjectData(myToday)
    const partnerSubjectData = makeSubjectData(pMonth)
    const partnerTodaySubjectData = makeSubjectData(pToday)

    // Focus
    const makeFocusStats = (sessions: StudySession[]) => {
      const valid = sessions.filter(s => s.duration_minutes && s.duration_minutes > 0)
      const avgMin = valid.length ? Math.round(valid.reduce((a, s) => a + (s.duration_minutes || 0), 0) / valid.length) : 0
      const maxMin = valid.length ? Math.max(...valid.map(s => s.duration_minutes || 0)) : 0
      const hourCount: Record<number, number> = {}
      for (let hour = 0; hour < 24; hour++) hourCount[hour] = 0
      sessions.forEach(s => { hourCount[new Date(s.start_time).getHours()] += (s.duration_minutes || 0) })
      const bestH = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]
      const bestHour = bestH ? `${bestH[0]}:00-${parseInt(bestH[0]) + 1}:00` : '—'
      const hour = parseInt(bestH?.[0] || '0')
      const bestPeriod = hour < 6 ? '凌晨' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 21 ? '傍晚' : '晚上'
      return { avgMin, maxMin, bestHour, bestPeriod }
    }
    const myFocus = makeFocusStats(mySessions)
    const partnerFocus = makeFocusStats(pSessions)

    // Goal
    const allMin = mySessions.reduce((s, r) => s + (r.duration_minutes || 0), 0)
    const goalPct = Math.round((allMin / GOAL_TOTAL) * 1000) / 10
    const partnerAllMin = pSessions.reduce((s, r) => s + (r.duration_minutes || 0), 0)
    const partnerGoalPct = Math.round((partnerAllMin / GOAL_TOTAL) * 1000) / 10

    // Dual
    const pDays = new Set(pSessions.map(s => s.date))
    const bothDays = new Set([...daySet].filter(d => pDays.has(d)))
    const combinedWk = my30.filter(s => s.date >= weekStart && pDays.has(s.date)).length
    let togetherStreak = 0, maxTogether = 0
    for (const d of [...bothDays].sort()) {
      if (bothDays.has(shiftDateKey(d, -1))) togetherStreak++
      else { maxTogether = Math.max(maxTogether, togetherStreak); togetherStreak = 1 }
    }
    maxTogether = Math.max(maxTogether, togetherStreak)

    // Timeline
    const timeline = [
      ...myToday.map(s => ({ ...s, nickname: user.nickname })),
      ...pToday.map(s => ({ ...s, nickname: partner?.nickname || '对方' })),
    ].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    setData({
      todayMinutes: todayMin, weekMinutes: weekMin, monthMinutes: monthMin,
      partnerTodayMinutes: partnerTodayMin, partnerWeekMinutes: partnerWeekMin, partnerMonthMinutes: partnerMonthMin,
      streakDays: streak, maxStreak: maxSt, partnerStreakDays: pStreak, partnerMaxStreak: pMaxStreak,
      totalDays90: new Set(my90.map(session => session.date)).size, totalMinutes90: my90.reduce((s, r) => s + (r.duration_minutes || 0), 0),
      partnerTotalDays90: new Set(p90.map(session => session.date)).size, partnerTotalMinutes90: p90.reduce((s, r) => s + (r.duration_minutes || 0), 0),
      trendData, trend7Data, todayTrendData, heatmapData: makeHeatmap(my90), partnerHeatmapData: makeHeatmap(p90),
      subjectData, todaySubjectData, partnerSubjectData, partnerTodaySubjectData,
      avgSessionMin: myFocus.avgMin, bestHour: myFocus.bestHour, bestPeriod: myFocus.bestPeriod, totalSessions: mySessions.length, maxSessionMin: myFocus.maxMin,
      todaySessions: myToday.length,
      partnerAvgSessionMin: partnerFocus.avgMin, partnerBestHour: partnerFocus.bestHour, partnerBestPeriod: partnerFocus.bestPeriod, partnerTotalSessions: pSessions.length, partnerMaxSessionMin: partnerFocus.maxMin, partnerTodaySessions: pToday.length,
      totalGoalMinutes: GOAL_TOTAL, currentTotalMinutes: allMin, goalPct, partnerCurrentTotalMinutes: partnerAllMin, partnerGoalPct,
      combinedDays: bothDays.size, combinedSessionsWeek: combinedWk, bestTogetherStreak: maxTogether,
      todayTimeline: timeline,
    })
    setLoading(false)
  }, [user, partner, selectedDate])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`study_analytics_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions' }, () => {
        void fetchAll()
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [user?.id, partner?.id, fetchAll])

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('study_sessions').delete().eq('id', id)
    if (error) {
      alert(`删除失败：${error.message}`)
      return
    }
    fetchAll()
  }

  return { data, loading, deleteSession, fetchAll }
}
