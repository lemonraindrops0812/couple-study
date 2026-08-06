import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'

interface Props { data: StudyAnalytics }

export function StudyOverviewCard({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        📚 学习总览
      </h3>

      <div className="grid grid-cols-4 gap-4">
        <MetricBlock label="今日学习" value={`${(data.todayMinutes / 60).toFixed(1)}h`} sub={`${data.todaySessions}次专注`} />
        <MetricBlock label="本周累计" value={`${(data.weekMinutes / 60).toFixed(1)}h`} sub="—" />
        <MetricBlock label="本月累计" value={`${(data.monthMinutes / 60).toFixed(1)}h`} sub="—" />
        <MetricBlock label="连续学习" value={`${data.streakDays}天`} sub={`最长 ${data.maxStreak} 天`} highlight />
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
