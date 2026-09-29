import { useState } from 'react'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { AnalyticsPersonToggle, type AnalyticsPerson } from './AnalyticsPersonToggle'

interface Props { data: StudyAnalytics }

export function GoalProgress({ data }: Props) {
  const [person, setPerson] = useState<AnalyticsPerson>('me')
  const isPartner = person === 'partner'
  const totalH = (data.totalGoalMinutes / 60).toFixed(0)
  const currentTotalMinutes = isPartner ? data.partnerCurrentTotalMinutes : data.currentTotalMinutes
  const goalPct = isPartner ? data.partnerGoalPct : data.goalPct
  const curH = (currentTotalMinutes / 60).toFixed(0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🎯 考研目标</h3>
        <AnalyticsPersonToggle value={person} onChange={setPerson} />
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-teal-600">{goalPct}%</span>
        <span className="text-xs text-gray-400">完成度</span>
      </div>

      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(goalPct, 100)}%` }} />
      </div>

      <div className="flex justify-between text-[10px] text-gray-400">
        <span>当前 {curH}h</span>
        <span>目标 {totalH}h</span>
      </div>
    </div>
  )
}
