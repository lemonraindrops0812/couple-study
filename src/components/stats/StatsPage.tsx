import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { StudySession } from '../../types'

export function StatsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [view, setView] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    if (!user) return
    const now = new Date()
    let startDate: string
    if (view === 'today') {
      startDate = now.toISOString().split('T')[0]
    } else if (view === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      startDate = weekStart.toISOString().split('T')[0]
    } else {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    }

    supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('start_time', { ascending: false })
      .then(({ data }) => {
        if (data) setSessions(data as StudySession[])
      })
  }, [user, view])

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const sessionCount = sessions.length

  // Chart data by subject
  const subjectData = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.subject] = (acc[s.subject] || 0) + (s.duration_minutes || 0)
    return acc
  }, {})
  const chartData = Object.entries(subjectData).map(([name, minutes]) => ({
    name,
    minutes: Math.round(minutes),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">学习统计</h2>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(['today', 'week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {v === 'today' ? '今天' : v === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{sessionCount}</p>
          <p className="text-xs text-gray-400">学习次数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{totalHours}</p>
          <p className="text-xs text-gray-400">总小时数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{totalMinutes}</p>
          <p className="text-xs text-gray-400">总分钟数</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">各科目学习时长</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">最近记录</h3>
          <div className="space-y-1">
            {sessions.slice(0, 20).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{s.subject}</span>
                <span className="text-gray-400">
                  {new Date(s.start_time).toLocaleDateString('zh-CN')} · {s.duration_minutes || 0}分钟
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
