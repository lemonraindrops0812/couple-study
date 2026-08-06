import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Clock, CheckCircle2, Zap } from 'lucide-react'
import type { StudySession } from '../../types'

interface Props {
  userId: string
  nickname: string
  avatarUrl?: string
  liveActivity: { subject: string; start_time: string } | null
}

function AvatarImg({ nickname, url, size }: { nickname: string; url?: string; size: string }) {
  if (url) {
    return <img src={url} alt={nickname} className={`${size} rounded-full object-cover`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
  }
  return <div className={`${size} rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0`}>{nickname?.[0] || '?'}</div>
}

export function UserStatusCard({ userId, nickname, avatarUrl, liveActivity }: Props) {
  const [studyMinutes, setStudyMinutes] = useState(0)
  const [studyCount, setStudyCount] = useState(0)
  const [tasksDone, setTasksDone] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', userId).eq('date', today),
      supabase.from('tasks').select('*').eq('user_id', userId).eq('date', today),
    ]).then(([{ data: sessions }, { data: tasks }]) => {
      const s = (sessions as StudySession[]) || []
      setStudyMinutes(s.reduce((sum, r) => sum + (r.duration_minutes || 0), 0))
      setStudyCount(s.length)
      setTasksDone((tasks as any[])?.filter((t: any) => t.completed).length || 0)
    })
  }, [userId, today])

  useEffect(() => {
    if (!liveActivity) { setElapsed(0); return }
    const start = new Date(liveActivity.start_time).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [liveActivity])

  const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const fmtMinutes = (mins: number) => mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}min`

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <AvatarImg nickname={nickname} url={avatarUrl} size="w-11 h-11 text-lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{nickname}</h3>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">
          在线
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-teal-50 rounded-lg p-2.5 text-center">
          <Clock size={14} className="mx-auto mb-0.5 text-teal-500" />
          <p className="text-sm font-bold text-gray-900">{fmtMinutes(studyMinutes)}</p>
          <p className="text-[10px] text-gray-400">学习</p>
        </div>
        <div className="bg-teal-50 rounded-lg p-2.5 text-center">
          <CheckCircle2 size={14} className="mx-auto mb-0.5 text-teal-500" />
          <p className="text-sm font-bold text-gray-900">{tasksDone}</p>
          <p className="text-[10px] text-gray-400">任务</p>
        </div>
        <div className="bg-teal-50 rounded-lg p-2.5 text-center">
          <Zap size={14} className="mx-auto mb-0.5 text-teal-500" />
          <p className="text-sm font-bold text-gray-900">{studyCount}</p>
          <p className="text-[10px] text-gray-400">专注</p>
        </div>
      </div>

      {/* Live status */}
      {liveActivity ? (
        <div className="flex items-center gap-2 bg-teal-50 rounded-lg px-3 py-2.5">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-teal-700 truncate">
              正在学习 {liveActivity.subject}
            </p>
            <p className="text-[10px] text-teal-500">{fmtTime(elapsed)}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
          <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
          <p className="text-xs text-gray-400">当前未学习</p>
        </div>
      )}
    </div>
  )
}
