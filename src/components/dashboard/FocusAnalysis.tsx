import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { Target, Clock, Zap } from 'lucide-react'

interface Props { data: StudyAnalytics }

export function FocusAnalysis({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">⏱️ 专注分析</h3>
      <div className="grid grid-cols-3 gap-3">
        <MiniMetric icon={Clock} label="平均单次" value={`${data.avgSessionMin}min`} />
        <MiniMetric icon={Zap} label="累计专注" value={`${data.totalSessions}次`} />
        <MiniMetric icon={Target} label="最长一次" value={data.maxSessionMin >= 60 ? `${(data.maxSessionMin / 60).toFixed(1)}h` : `${data.maxSessionMin}min`} />
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
        <span>最佳学习时段：{data.bestHour}</span>
        <span>偏好：{data.bestPeriod}</span>
      </div>
    </div>
  )
}

function MiniMetric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Icon size={14} className="mx-auto mb-1 text-teal-500" />
      <p className="text-sm font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  )
}
