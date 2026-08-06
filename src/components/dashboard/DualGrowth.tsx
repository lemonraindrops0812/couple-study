import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { Users, Heart } from 'lucide-react'

interface Props { data: StudyAnalytics }

export function DualGrowth({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Heart size={14} className="text-pink-400" /> 我们的共同成长
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-pink-50 rounded-lg p-3 text-center">
          <Users size={14} className="mx-auto mb-1 text-pink-500" />
          <p className="text-sm font-bold text-gray-900">{data.combinedSessionsWeek}</p>
          <p className="text-[10px] text-gray-400">本周共同学习</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-3 text-center">
          <p className="text-sm font-bold text-gray-900">{data.combinedDays}</p>
          <p className="text-[10px] text-gray-400">一起坚持(天)</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-3 text-center">
          <p className="text-sm font-bold text-gray-900">{data.bestTogetherStreak}</p>
          <p className="text-[10px] text-gray-400">最长连续</p>
        </div>
      </div>
    </div>
  )
}
