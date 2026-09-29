import { useState } from 'react'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { AnalyticsPersonToggle, type AnalyticsPerson } from './AnalyticsPersonToggle'

interface Props { data: StudyAnalytics; dayLabel?: string }

export function StudyOverviewCard({ data, dayLabel = '所选日' }: Props) {
  const [person, setPerson] = useState<AnalyticsPerson>('me')
  const isPartner = person === 'partner'
  const metrics = isPartner
    ? {
        today: data.partnerTodayMinutes, week: data.partnerWeekMinutes, month: data.partnerMonthMinutes,
        sessions: data.partnerTodaySessions, streak: data.partnerStreakDays, maxStreak: data.partnerMaxStreak,
      }
    : {
        today: data.todayMinutes, week: data.weekMinutes, month: data.monthMinutes,
        sessions: data.todaySessions, streak: data.streakDays, maxStreak: data.maxStreak,
      }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📚 学习总览</h3>
        <AnalyticsPersonToggle value={person} onChange={setPerson} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricBlock label={`${dayLabel}学习`} value={`${(metrics.today / 60).toFixed(1)}h`} sub={`${metrics.sessions}次专注`} />
        <MetricBlock label="本周累计" value={`${(metrics.week / 60).toFixed(1)}h`} sub="—" />
        <MetricBlock label="本月累计" value={`${(metrics.month / 60).toFixed(1)}h`} sub="—" />
        <MetricBlock label="连续学习" value={`${metrics.streak}天`} sub={`最长 ${metrics.maxStreak} 天`} highlight />
      </div>
    </div>
  )
}

function MetricBlock({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`text-center p-3 rounded-xl ${highlight ? 'bg-teal-50' : 'bg-gray-50'}`}>
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-teal-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
