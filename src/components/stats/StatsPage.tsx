import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { StudySession } from '../../types'
import { Clock, Users, BookOpen, TrendingUp, Pencil, Trash2 } from 'lucide-react'
import { formatDateKey, getDateOffset, getLogicalDate, getToday, getWeekStart } from '../../lib/date'
import { StudySessionEditor } from '../study/StudySessionEditor'

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']

export function StatsPage() {
  const { user, partner } = useAuth()
  const [mySessions, setMySessions] = useState<StudySession[]>([])
  const [partnerSessions, setPartnerSessions] = useState<StudySession[]>([])
  const [view, setView] = useState<'today' | 'week' | 'month'>('week')
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)

  const deleteSession = async (id: string) => {
    if (!window.confirm('确定删除这条学习记录吗？此操作无法撤销。')) return
    const { error } = await supabase.from('study_sessions').delete().eq('id', id)
    if (error) {
      alert(`删除失败：${error.message}`)
      return
    }
    setMySessions(prev => prev.filter(s => s.id !== id))
    setPartnerSessions(prev => prev.filter(s => s.id !== id))
  }

  const fetchData = () => {
    if (!user) return
    let startDate: string
    if (view === 'today') {
      startDate = getToday()
    } else if (view === 'week') {
      startDate = getWeekStart()
    } else {
      const now = getLogicalDate()
      startDate = formatDateKey(new Date(now.getFullYear(), now.getMonth(), 1))
    }

    Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', user.id).gte('date', startDate).order('start_time', { ascending: false }),
      partner ? supabase.from('study_sessions').select('*').eq('user_id', partner.id).gte('date', startDate).order('start_time', { ascending: false }) : Promise.resolve({ data: [] }),
    ]).then(([{ data: d1 }, { data: d2 }]) => {
      setMySessions((d1 as StudySession[]) || [])
      setPartnerSessions((d2 as StudySession[]) || [])
    })
  }

  useEffect(() => { fetchData() }, [user, partner, view])

  const myMin = mySessions.reduce((s, r) => s + (r.duration_minutes || 0), 0)
  const pMin = partnerSessions.reduce((s, r) => s + (r.duration_minutes || 0), 0)
  const totalMin = myMin + pMin

  // Subject breakdown combined
  const subjectMap: Record<string, number> = {}
  ;[...mySessions, ...partnerSessions].forEach(s => {
    subjectMap[s.subject] = (subjectMap[s.subject] || 0) + (s.duration_minutes || 0)
  })
  const pieData = Object.entries(subjectMap).map(([name, value]) => ({ name, value }))

  // Daily breakdown (last 7 days - both combined)
  const dailyMap: Record<string, { me: number; partner: number }> = {}
  for (let i = 6; i >= 0; i--) {
    dailyMap[getDateOffset(-i)] = { me: 0, partner: 0 }
  }
  mySessions.forEach(s => { if (dailyMap[s.date]) dailyMap[s.date].me += (s.duration_minutes || 0) })
  partnerSessions.forEach(s => { if (dailyMap[s.date]) dailyMap[s.date].partner += (s.duration_minutes || 0) })
  const dailyData = Object.entries(dailyMap).map(([date, v]) => ({
    date: date.slice(5),
    [user?.nickname || '我']: Math.round(v.me),
    [partner?.nickname || '对方']: Math.round(v.partner),
  }))

  const viewLabel = view === 'today' ? '今天' : view === 'week' ? '本周' : '本月'
  const hasData = mySessions.length > 0 || partnerSessions.length > 0
  const formatTime = (value: string | null) => value ? new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">学习统计</h2>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(['today', 'week', 'month'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {v === 'today' ? '今天' : v === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label={`${viewLabel}总时长`} value={`${(totalMin / 60).toFixed(1)}h`} />
        <StatCard icon={BookOpen} label="学习次数" value={mySessions.length + partnerSessions.length} />
        <StatCard icon={Users} label={user?.nickname || '我'} value={`${(myMin / 60).toFixed(1)}h`} sub={`${mySessions.length}次`} />
        <StatCard icon={Users} label={partner?.nickname || '对方'} value={`${(pMin / 60).toFixed(1)}h`} sub={`${partnerSessions.length}次`} />
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm text-gray-400 mb-1">暂无{viewLabel}数据</p>
          <p className="text-xs text-gray-300">开始学习后这里会出现统计图表</p>
        </div>
      ) : (
        <>
          {/* Dual comparison chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">每日学习时长对比</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -15, bottom: -5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={35} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={user?.nickname || '我'} fill="#0d9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey={partner?.nickname || '对方'} fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">科目分布</h3>
              {pieData.length > 0 ? (
                <div className="flex items-center">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => `${v}min`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[11px] text-gray-600 truncate flex-1">{d.name}</span>
                        <span className="text-[11px] text-gray-400">{d.value}min</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">暂无数据</p>
              )}
            </div>

            {/* Recent sessions */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">最近学习记录</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {[...mySessions, ...partnerSessions].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).slice(0, 20).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 group">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{s.date.slice(5)}</span>
                        <span className="text-xs text-gray-700 truncate">{s.subject}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-400">{formatTime(s.start_time)}–{formatTime(s.end_time)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{s.duration_minutes || 0}min</span>
                      {s.user_id === user?.id && s.end_time && <>
                        <button
                          onClick={() => setEditingSession(s)}
                          className="inline-flex items-center gap-1 rounded-md border border-teal-100 bg-teal-50 px-1.5 py-1 text-[10px] font-medium text-teal-700 transition-colors hover:border-teal-200 hover:bg-teal-100"
                          title="修改起止时间"
                          aria-label="修改起止时间"
                        >
                          <Pencil size={11} />
                          <span>编辑时间</span>
                        </button>
                        <button onClick={() => deleteSession(s.id)} className="rounded-md p-1 text-gray-300 transition-colors hover:bg-rose-50 hover:text-red-400" title="删除记录" aria-label="删除记录">
                          <Trash2 size={12} />
                        </button>
                      </>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {editingSession && (
        <StudySessionEditor
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={() => { setEditingSession(null); fetchData() }}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
      <Icon size={16} className="mx-auto mb-1 text-teal-500" />
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
      {sub && <p className="text-[9px] text-gray-300">{sub}</p>}
    </div>
  )
}
