import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { useAuth } from '../../hooks/useAuth'
import { Sprout, Moon } from 'lucide-react'

interface Props { data: StudyAnalytics }

export function StudyTrendChart({ data }: Props) {
  const { user, partner } = useAuth()
  const [range, setRange] = useState<'7' | '30'>('7')

  const chartData = range === '7' ? data.trend7Data : data.trendData

  const summary = useMemo(() => {
    const totalMe = chartData.reduce((s, d) => s + d.me, 0)
    const totalPartner = chartData.reduce((s, d) => s + d.partner, 0)
    const daysMe = chartData.filter(d => d.me > 0).length
    const daysPartner = chartData.filter(d => d.partner > 0).length
    return { totalMe, totalPartner, daysMe, daysPartner }
  }, [chartData])

  const fmtH = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}min`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8faf5 100%)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">📈 学习时间趋势</h3>
        <div className="flex bg-stone-100 rounded-lg p-0.5">
          {(['7', '30'] as const).map(v => (
            <button key={v} onClick={() => setRange(v)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                range === v ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}>
              近{v}天
            </button>
          ))}
        </div>
      </div>

      {/* Warm summary cards */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-emerald-50/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sprout size={13} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-600 font-medium">{user?.nickname || '我'}</span>
          </div>
          <p className="text-sm font-bold text-emerald-700">
            {summary.totalMe > 0 ? `${fmtH(summary.totalMe)}学习` : '今天休息中'}
          </p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{summary.daysMe}天坚持</p>
        </div>
        <div className="flex-1 bg-blue-50/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Moon size={13} className="text-blue-400" />
            <span className="text-[10px] text-blue-500 font-medium">{partner?.nickname || '对方'}</span>
          </div>
          <p className="text-sm font-bold text-blue-600">
            {summary.totalPartner > 0 ? `${fmtH(summary.totalPartner)}学习` : '今天休息中'}
          </p>
          <p className="text-[10px] text-blue-500 mt-0.5">{summary.daysPartner}天坚持</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={range === '7' ? 0 : 4} />
          <YAxis tick={{ fontSize: 10 }} width={30} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="me" name={user?.nickname || '我'} fill="#0d9488" radius={[3, 3, 0, 0]} />
          <Bar dataKey="partner" name={partner?.nickname || '对方'} fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
