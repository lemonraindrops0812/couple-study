import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardData } from '../../types'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  data: DashboardData
  loading: boolean
}

export function StudyStatistics({ data, loading }: Props) {
  const [view, setView] = useState<'today' | 'week'>('today')
  const hours = (data.todayStudyMinutes / 60).toFixed(1)
  const diff = data.todayStudyMinutes - data.yesterdayStudyMinutes
  const diffLabel = diff >= 0 ? `+${diff}min` : `${diff}min`

  if (loading) return <Skeleton />

  const chartData: { hour: string; minutes: number }[] = view === 'today' ? data.hourlyData : data.weeklyCombined.map(d => ({ hour: d.day, minutes: d.sessions }))

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">学习统计</h3>
        <div className="flex bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setView('today')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              view === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            本周
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Clock size={20} className="text-teal-500" />
        <div>
          <p className="text-2xl font-bold text-gray-900">{hours}<span className="text-sm font-normal text-gray-500 ml-1">小时</span></p>
        </div>
        <div className={`ml-auto flex items-center gap-1 text-xs ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {diff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {diffLabel}
          <span className="text-gray-400">vs 昨日</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey={view === 'today' ? 'hour' : 'day'} tick={{ fontSize: 9 }} interval={view === 'today' ? 3 : 0} />
          <YAxis tick={{ fontSize: 9 }} width={30} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }}
            formatter={(value: unknown) => [`${value}min`, view === 'today' ? '学习时长' : '次数']}
          />
          <Bar dataKey="minutes" fill="#0d9488" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-32 bg-gray-100 rounded" />
    </div>
  )
}
