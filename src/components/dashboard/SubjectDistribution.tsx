import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { ArrowLeft } from 'lucide-react'

interface Props { data: StudyAnalytics }

const CAT_COLORS: Record<string, string> = { '专业课': '#0d9488', '英语': '#3b82f6', '政治': '#f59e0b', '其他': '#8b5cf6' }
const SUB_COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#3b82f6', '#60a5fa', '#93c5fd', '#f59e0b', '#fbbf24', '#fcd34d', '#8b5cf6', '#a78bfa', '#c4b5fd']

// Map subjects to parent categories
function classifySubject(name: string): { category: string; sub: string } {
  if (name.startsWith('英语刷真题')) return { category: '英语', sub: '刷真题' }
  if (name.startsWith('英语·')) return { category: '英语', sub: name.replace('英语·', '') }
  if (name === '英语') return { category: '英语', sub: '英语' }
  const proBooks = ['口腔解剖生理学', '牙体牙髓病学', '牙周病学', '口腔颌面外科学', '口腔修复学', '口腔正畸学']
  if (proBooks.includes(name)) return { category: '专业课', sub: name }
  const poliBooks = ['马原', '史纲', '思法', '毛概', '新思想']
  if (poliBooks.includes(name)) return { category: '政治', sub: name }
  return { category: '其他', sub: name }
}

export function SubjectDistribution({ data }: Props) {
  const [drilldown, setDrilldown] = useState<string | null>(null) // null = categories, string = category name

  const { categoryData, subData } = useMemo(() => {
    if (!data.subjectData.length) return { categoryData: [], subData: {} as Record<string, { name: string; minutes: number; pct: number }[]> }

    // Group into categories
    const catMap: Record<string, number> = {}
    const subMap: Record<string, Record<string, number>> = {}

    data.subjectData.forEach(s => {
      const { category, sub } = classifySubject(s.name)
      catMap[category] = (catMap[category] || 0) + s.minutes
      if (!subMap[category]) subMap[category] = {}
      subMap[category][sub] = (subMap[category][sub] || 0) + s.minutes
    })

    const totalCat = Object.values(catMap).reduce((a, b) => a + b, 0)
    const categoryData = Object.entries(catMap)
      .map(([name, minutes]) => ({ name, minutes, pct: totalCat ? Math.round((minutes / totalCat) * 100) : 0 }))
      .sort((a, b) => {
        if (a.name === '其他') return 1
        if (b.name === '其他') return -1
        return b.minutes - a.minutes
      })

    const subData: Record<string, { name: string; minutes: number; pct: number }[]> = {}
    Object.entries(subMap).forEach(([cat, subs]) => {
      const total = Object.values(subs).reduce((a, b) => a + b, 0)
      subData[cat] = Object.entries(subs)
        .map(([name, minutes]) => ({ name, minutes, pct: total ? Math.round((minutes / total) * 100) : 0 }))
        .sort((a, b) => b.minutes - a.minutes)
    })

    return { categoryData, subData }
  }, [data.subjectData])

  if (!data.subjectData.length) return null

  const displayData = drilldown && subData[drilldown] ? subData[drilldown] : categoryData

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        {drilldown && (
          <button onClick={() => setDrilldown(null)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={14} />
          </button>
        )}
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          🎯 {drilldown ? `${drilldown}组成` : '本月学习组成'}
        </h3>
      </div>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={displayData}
              dataKey="minutes"
              nameKey="name"
              cx="50%" cy="50%"
              innerRadius={32} outerRadius={52}
            >
              {displayData.map((_, i) => (
                <Cell key={i} fill={drilldown ? SUB_COLORS[i % SUB_COLORS.length] : CAT_COLORS[displayData[i].name] || SUB_COLORS[i % SUB_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: unknown) => `${v}min`} />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-1.5 flex-1">
          {displayData.slice(0, 8).map((s, i) => (
            <button
              key={s.name}
              onClick={() => { if (!drilldown && subData[s.name]) setDrilldown(s.name) }}
              disabled={!!drilldown}
              className={`w-full flex items-center gap-2 text-left ${!drilldown && subData[s.name] ? 'hover:bg-gray-50 rounded px-1 -mx-1 cursor-pointer' : ''}`}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: drilldown ? SUB_COLORS[i % SUB_COLORS.length] : CAT_COLORS[s.name] || SUB_COLORS[i % SUB_COLORS.length] }} />
              <span className="text-[11px] text-gray-700 truncate flex-1">{s.name}</span>
              <span className="text-[11px] font-medium text-gray-900">{s.minutes}min</span>
              <span className="text-[10px] text-gray-400 w-8 text-right">{s.pct}%</span>
            </button>
          ))}
        </div>
      </div>

      {!drilldown && (
        <p className="text-[10px] text-gray-300 mt-3 text-center">点击分类查看细分 →</p>
      )}
    </div>
  )
}
