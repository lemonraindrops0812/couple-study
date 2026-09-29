import { useMemo, useState } from 'react'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { Sprout, Flame, BookOpen } from 'lucide-react'
import { AnalyticsPersonToggle, type AnalyticsPerson } from './AnalyticsPersonToggle'

interface Props { data: StudyAnalytics }

function dotColor(minutes: number): string {
  if (minutes === 0) return 'bg-[#f1f3f0]'
  if (minutes < 30) return 'bg-[#d9f5e8]'
  if (minutes < 120) return 'bg-[#8edfc3]'
  if (minutes < 240) return 'bg-[#13b981]'
  return 'bg-[#0d9488]'
}

export function StudyHeatmap({ data }: Props) {
  const [person, setPerson] = useState<AnalyticsPerson>('me')
  const isPartner = person === 'partner'
  const heatmapData = isPartner ? data.partnerHeatmapData : data.heatmapData
  const streakDays = isPartner ? data.partnerStreakDays : data.streakDays
  const totalMinutes90 = isPartner ? data.partnerTotalMinutes90 : data.totalMinutes90
  const maxStreak = isPartner ? data.partnerMaxStreak : data.maxStreak
  const weeks = useMemo(() => {
    const w: { date: string; minutes: number }[][] = []
    for (let i = 0; i < heatmapData.length; i += 7) {
      w.push(heatmapData.slice(i, i + 7))
    }
    return w
  }, [heatmapData])

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5" style={{ background: '#fffcf5' }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">🌱 坚持成长 · 近90天</h3>
        <AnalyticsPersonToggle value={person} onChange={setPerson} />
      </div>

      {/* Dot grid */}
      <div className="flex gap-0.5 overflow-x-auto pb-2 mb-4 justify-center">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(day => (
              <div key={day.date}
                className={`w-3.5 h-3.5 rounded-full ${dotColor(day.minutes)}`}
                title={`${day.date}: ${day.minutes}分钟`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mb-4 text-[9px] text-stone-400">
        <span>少</span>
        <div className="w-3 h-3 rounded-full bg-[#f1f3f0]" />
        <div className="w-3 h-3 rounded-full bg-[#d9f5e8]" />
        <div className="w-3 h-3 rounded-full bg-[#8edfc3]" />
        <div className="w-3 h-3 rounded-full bg-[#13b981]" />
        <div className="w-3 h-3 rounded-full bg-[#0d9488]" />
        <span>多</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-2.5 text-center border border-stone-100">
          <Sprout size={16} className="mx-auto mb-1 text-emerald-500" />
          <p className="text-lg font-bold text-stone-700">{streakDays}</p>
          <p className="text-[10px] text-stone-400">连续坚持</p>
        </div>
        <div className="bg-white rounded-xl p-2.5 text-center border border-stone-100">
          <BookOpen size={16} className="mx-auto mb-1 text-emerald-500" />
          <p className="text-lg font-bold text-stone-700">{(totalMinutes90 / 60).toFixed(0)}</p>
          <p className="text-[10px] text-stone-400">累计小时</p>
        </div>
        <div className="bg-white rounded-xl p-2.5 text-center border border-stone-100">
          <Flame size={16} className="mx-auto mb-1 text-orange-400" />
          <p className="text-lg font-bold text-stone-700">{maxStreak}</p>
          <p className="text-[10px] text-stone-400">最长连续</p>
        </div>
      </div>
    </div>
  )
}
