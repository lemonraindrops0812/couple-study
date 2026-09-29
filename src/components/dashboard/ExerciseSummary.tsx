import { useNavigate } from 'react-router-dom'
import { Dumbbell, Timer, ArrowRight } from 'lucide-react'
import type { DashboardData } from '../../types'

interface Props {
  data: DashboardData
  isCurrent?: boolean
}

export function ExerciseSummary({ data, isCurrent = true }: Props) {
  const navigate = useNavigate()
  const { exerciseMinutes, exerciseCount } = data
  const hasData = exerciseMinutes > 0 || exerciseCount > 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">运动记录</h3>
        <button onClick={() => navigate('/exercise')} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 transition-colors">
          详细 <ArrowRight size={12} />
        </button>
      </div>

      {!hasData ? (
        <div className="text-center py-5">
          <Dumbbell size={28} className="mx-auto mb-2 text-gray-200" />
          <p className="text-xs text-gray-400 mb-1">还没有运动记录</p>
          <button onClick={() => navigate('/exercise')} className="text-[11px] text-teal-600 hover:text-teal-700">{isCurrent ? '开始今天的训练 →' : '前往训练页 →'}</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-teal-50 rounded-lg p-3 text-center">
            <Timer size={16} className="mx-auto mb-1 text-teal-500" />
            <p className="text-lg font-bold text-gray-900">{exerciseMinutes}</p>
            <p className="text-[10px] text-gray-400">运动分钟</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-3 text-center">
            <Dumbbell size={16} className="mx-auto mb-1 text-teal-500" />
            <p className="text-lg font-bold text-gray-900">{exerciseCount}</p>
            <p className="text-[10px] text-gray-400">训练组数</p>
          </div>
        </div>
      )}
    </div>
  )
}
