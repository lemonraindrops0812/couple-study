import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { useAuth } from '../../hooks/useAuth'
import { Sprout, Moon } from 'lucide-react'

interface Props { data: StudyAnalytics; dayLabel?: string }

export function StudyTrendChart({ data, dayLabel = '所选日' }: Props) {
  const { user, partner } = useAuth()
  const [range, setRange] = useState<'today' | '7' | '30'>('7')

  const chartData = range === 'today'
    ? data.todayTrendData
    : range === '7'
      ? data.trend7Data
      : data.trendData

  const highestMinutes = Math.max(0, ...chartData.flatMap(item => [item.me, item.partner]))
  const maximumHours = Math.max(1, Math.ceil(highestMinutes / 60))
  const hourTickStep = maximumHours > 12 ? 2 : 1
  const hourTicks = Array.from(
    { length: Math.ceil(maximumHours / hourTickStep) + 1 },
    (_, index) => index * hourTickStep * 60,
  )
  const todayAxisMaximum = Math.max(60, Math.ceil(highestMinutes / 10) * 10)
  const todayTicks = Array.from(
    { length: todayAxisMaximum / 10 + 1 },
    (_, index) => index * 10,
  )

  const summary = useMemo(() => {
    const totalMe = chartData.reduce((s, d) => s + d.me, 0)
    const totalPartner = chartData.reduce((s, d) => s + d.partner, 0)
    const daysMe = chartData.filter(d => d.me > 0).length
    const daysPartner = chartData.filter(d => d.partner > 0).length
    return { totalMe, totalPartner, daysMe, daysPartner }
  }, [chartData])

  const fmtH = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}min`
  const formatTooltipDuration = (value: unknown) => {
    const minutes = Math.round(Number(value) || 0)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (!hours) return `${remainingMinutes}分钟`
    if (!remainingMinutes) return `${hours}小时`
    return `${hours}小时${remainingMinutes}分钟`
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8faf5 100%)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">📈 学习时间趋势</h3>
        <div className="flex bg-stone-100 rounded-lg p-0.5">
          {(['today', '7', '30'] as const).map(v => (
            <button key={v} onClick={() => setRange(v)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                range === v ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}>
              {v === 'today' ? '当天' : `近${v}天`}
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
            {summary.totalMe > 0 ? `${fmtH(summary.totalMe)}学习` : `${dayLabel}休息中`}
          </p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{range === 'today' ? `${summary.daysMe} 个学习时段` : `${summary.daysMe}天坚持`}</p>
        </div>
        <div className="flex-1 bg-blue-50/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Moon size={13} className="text-blue-400" />
            <span className="text-[10px] text-blue-500 font-medium">{partner?.nickname || '对方'}</span>
          </div>
          <p className="text-sm font-bold text-blue-600">
            {summary.totalPartner > 0 ? `${fmtH(summary.totalPartner)}学习` : `${dayLabel}休息中`}
          </p>
          <p className="text-[10px] text-blue-500 mt-0.5">{range === 'today' ? `${summary.daysPartner} 个学习时段` : `${summary.daysPartner}天坚持`}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={range === 'today' ? 1 : range === '7' ? 0 : 4} />
          <YAxis
            tick={{ fontSize: 10 }}
            width={52}
            domain={[0, range === 'today' ? todayAxisMaximum : maximumHours * 60]}
            ticks={range === 'today' ? todayTicks : hourTicks}
            allowDecimals={false}
            tickFormatter={value => {
              if (value === 0) return '0'
              if (range !== 'today') return `${value / 60}小时`
              return value % 60 === 0 ? `${value / 60}小时` : `${value}分钟`
            }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }}
            formatter={formatTooltipDuration}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="me" name={user?.nickname || '我'} fill="#0d9488" radius={[3, 3, 0, 0]} />
          <Bar dataKey="partner" name={partner?.nickname || '对方'} fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
