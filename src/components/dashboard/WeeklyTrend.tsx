import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { DashboardData } from '../../types'
import { Users } from 'lucide-react'

interface Props {
  data: DashboardData
  endDateLabel?: string
}

export function WeeklyTrend({ data, endDateLabel = '所选日' }: Props) {
  const hasData = data.weeklyCombined.some(d => d.sessions > 0 || d.tasks > 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Users size={16} className="text-teal-500" /> 近7日共同趋势
      </h3>

      {!hasData ? (
        <p className="text-xs text-gray-400 text-center py-6">
          截至{endDateLabel}还没有记录，开始学习吧 ✨
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.weeklyCombined} margin={{ top: 0, right: 0, left: -20, bottom: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="day" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} width={24} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="sessions" name="学习次数" fill="#0d9488" radius={[3, 3, 0, 0]} />
            <Bar dataKey="tasks" name="完成任务" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
