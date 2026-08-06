import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Flame, Sprout } from 'lucide-react'
import type { DashboardData } from '../../types'
import { useAuth } from '../../hooks/useAuth'

interface Props { data: DashboardData }
const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#a7f3d0', '#86efac']

export function GrowthStats({ data }: Props) {
  const { user, partner } = useAuth()

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">成长记录</h3>

      <div className="grid grid-cols-3 gap-4">
        {/* Streaks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">{user?.nickname || '我'}</span>
            <span className="text-lg font-bold text-teal-600">{data.streakDays}<span className="text-xs font-normal text-gray-400 ml-1">天</span></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">{partner?.nickname || '对方'}</span>
            <span className="text-lg font-bold text-teal-600">{data.partnerStreakDays}<span className="text-xs font-normal text-gray-400 ml-1">天</span></span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Flame size={14} className="text-orange-400" />
            <span className="text-[10px] text-gray-400">连续打卡</span>
          </div>
        </div>

        {/* Subject breakdown */}
        <div>
          {data.subjectBreakdown.length > 0 ? (
            <div className="flex items-center gap-2">
              <ResponsiveContainer width={70} height={70}>
                <PieChart>
                  <Pie data={data.subjectBreakdown} dataKey="minutes" nameKey="name" cx="50%" cy="50%" innerRadius={18} outerRadius={32}>
                    {data.subjectBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => `${value}min`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-0.5 flex-1">
                {data.subjectBreakdown.slice(0, 3).map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-gray-600 truncate flex-1">{s.name}</span>
                    <span className="text-[10px] text-gray-400">{s.minutes}min</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">暂无记录</p>
          )}
        </div>

        {/* Encouragement */}
        <div className="flex flex-col items-center justify-center text-center">
          <Sprout size={28} className="text-green-400 mb-1" />
          <p className="text-[11px] text-gray-500">
            {data.streakDays > 0 ? `已坚持 ${data.streakDays} 天` : '从今天开始'}
          </p>
          <p className="text-[10px] text-gray-300">一起成长 🌱</p>
        </div>
      </div>
    </div>
  )
}
