import { useState } from 'react'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { AnalyticsPersonToggle, type AnalyticsPerson } from './AnalyticsPersonToggle'

interface Props { data: StudyAnalytics }

const STAGES = [
  { min: 0, icon: '🌱', label: '刚刚种下', color: 'text-green-400' },
  { min: 1, icon: '🌿', label: '破土而出', color: 'text-green-500' },
  { min: 3, icon: '🪴', label: '茁壮成长', color: 'text-green-600' },
  { min: 7, icon: '🌳', label: '小有成就', color: 'text-emerald-600' },
  { min: 14, icon: '🌲', label: '枝繁叶茂', color: 'text-emerald-700' },
  { min: 30, icon: '🏡', label: '共同家园', color: 'text-teal-600' },
  { min: 60, icon: '🌺', label: '开花结果', color: 'text-pink-500' },
  { min: 100, icon: '🌟', label: '硕果累累', color: 'text-amber-500' },
]

export function GrowthTree({ data }: Props) {
  const [person, setPerson] = useState<AnalyticsPerson>('me')
  const isPartner = person === 'partner'
  const streakDays = isPartner ? data.partnerStreakDays : data.streakDays
  const maxStreak = isPartner ? data.partnerMaxStreak : data.maxStreak
  const totalDays = isPartner ? data.partnerTotalDays90 : data.totalDays90
  const stage = STAGES.filter(s => streakDays >= s.min).pop() || STAGES[0]

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-5 text-center" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 50%, #fefce8 100%)' }}>
      <div className="flex justify-end -mb-1">
        <AnalyticsPersonToggle value={person} onChange={setPerson} />
      </div>
      <p className="text-5xl mb-2 transition-all duration-500 hover:scale-110 inline-block">{stage.icon}</p>
      <p className="text-sm font-semibold text-amber-800">{stage.label}</p>
      <p className="text-xs text-amber-600 mt-1">连续 {streakDays} 天坚持</p>
      <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-amber-200">
        <div>
          <p className="text-lg font-bold text-amber-700">{totalDays}</p>
          <p className="text-[10px] text-amber-500">学习天数</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-700">{maxStreak}</p>
          <p className="text-[10px] text-amber-500">最长连续</p>
        </div>
      </div>
    </div>
  )
}
