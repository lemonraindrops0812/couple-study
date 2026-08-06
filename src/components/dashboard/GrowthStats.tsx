import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Flame, Sprout } from 'lucide-react'
import type { DashboardData } from '../../types'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  data: DashboardData
}

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#a7f3d0', '#86efac']

export function GrowthStats({ data }: Props) {
  const { user, partner } = useAuth()

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Streak */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Flame size={16} className="text-orange-500" /> 坚持天数
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{user?.nickname || '我'}</span>
            <span className="text-lg font-bold text-teal-600">{data.streakDays}<span className="text-xs font-normal text-gray-400 ml-1">天</span></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{partner?.nickname || '对方'}</span>
            <span className="text-lg font-bold text-teal-600">{data.partnerStreakDays}<span className="text-xs font-normal text-gray-400 ml-1">天</span></span>
          </div>
          <div className="text-center pt-2">
            <Sprout size={20} className="mx-auto text-green-400" />
            <p className="text-[10px] text-gray-400 mt-1">一起成长 🌱</p>
          </div>
        </div>
      </div>

      {/* Subject breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">学习分布</h3>
        {data.subjectBreakdown.length > 0 ? (
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={80} height={80}>
              <PieChart>
                <Pie data={data.subjectBreakdown} dataKey="minutes" nameKey="name" cx="50%" cy="50%" innerRadius={22} outerRadius={36}>
                  {data.subjectBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => `${value}min`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 flex-1">
              {data.subjectBreakdown.slice(0, 4).map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] text-gray-600 truncate">{s.name}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{s.minutes}min</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">今天暂无学习记录</p>
        )}
      </div>
    </div>
  )
}
