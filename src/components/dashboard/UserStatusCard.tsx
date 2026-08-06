import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Clock, CheckCircle2, Zap, Sprout } from 'lucide-react'
import { getToday } from '../../lib/date'
import type { StudySession } from '../../types'

interface Props {
  userId: string; nickname: string; avatarUrl?: string; isMe: boolean
  liveActivity: { subject: string; start_time: string } | null
  streakDays: number
}

function AvatarImg({ nickname, url, size }: { nickname: string; url?: string; size: string }) {
  if (url) return <img src={url} alt={nickname} className={`${size} rounded-full object-cover ring-2 ring-amber-100`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
  return <div className={`${size} rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold ring-2 ring-amber-200`}>{nickname?.[0] || '?'}</div>
}

function fmtRelative(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}小时前`
  if (diffH < 48) return '昨天'
  return `${Math.floor(diffH / 24)}天前`
}

export function UserStatusCard({ userId, nickname, avatarUrl, isMe, liveActivity, streakDays }: Props) {
  const [studyMinutes, setStudyMinutes] = useState(0)
  const [studyCount, setStudyCount] = useState(0)
  const [tasksDone, setTasksDone] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [lastActive, setLastActive] = useState('')

  const today = getToday()

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

    supabase.from('study_sessions').select('created_at,subject').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const ses = data[0] as any
          setLastActive(`${fmtRelative(ses.created_at)} 学习了${ses.subject}`)
        } else {
          supabase.from('exercise_records').select('created_at,exercise_name').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
            .then(({ data: d2 }) => {
              if (d2?.[0]) setLastActive(`${fmtRelative(d2[0].created_at)} 运动了${d2[0].exercise_name}`)
              else {
                supabase.from('diet_records').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
                  .then(({ data: d3 }) => {
                    if (d3?.[0]) setLastActive(`${fmtRelative(d3[0].created_at)} 记录了饮食`)
                    else setLastActive('')
                  })
              }
            })
        }
      })
  }, [userId, today])

  useEffect(() => {
    if (!liveActivity) { setElapsed(0); return }
    const start = new Date(liveActivity.start_time).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [liveActivity])

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }
  const fmtMin = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}min`

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-5 hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffdf7 100%)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <AvatarImg nickname={nickname} url={avatarUrl} size="w-12 h-12 text-lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{nickname}</h3>
          {lastActive && <p className="text-[10px] text-amber-600 truncate">{lastActive}</p>}
        </div>
        {streakDays > 0 && (
          <span className="shrink-0 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">🔥{streakDays}天</span>
        )}
      </div>

      {/* Stats — vertical rows */}
      <div className="space-y-1.5 mb-4">
        <StatRow icon={Clock} label="今日学习" value={fmtMin(studyMinutes)} color="bg-emerald-50 text-emerald-600" iconBg="bg-emerald-100" />
        <StatRow icon={CheckCircle2} label="完成任务" value={`${tasksDone} 个`} color="bg-amber-50 text-amber-600" iconBg="bg-amber-100" />
        <StatRow icon={Zap} label="专注次数" value={`${studyCount} 次`} color="bg-orange-50 text-orange-600" iconBg="bg-orange-100" />
      </div>

      {/* Encouragement */}
      <p className="text-[11px] text-gray-400 text-center mb-3 flex items-center justify-center gap-1">
        <Sprout size={12} className="text-green-400" />
        {isMe
          ? studyMinutes > 0 ? '今天也在慢慢靠近目标 🌱' : '准备好开始今天的努力了吗？'
          : studyMinutes > 0 ? '今天也在努力成长 ✨' : '期待今天的共同进步 💫'
        }
      </p>

      {/* Status */}
      {liveActivity ? (
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-lg">📚</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-700 truncate">正在专心学习 {liveActivity.subject}</p>
            <p className="text-[10px] text-emerald-500">已经坚持 {fmtTime(elapsed)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>{isMe ? '☁️' : '🌙'}</span>
          <p className="text-xs text-amber-600">
            {isMe ? '准备好开始今天的努力了吗？' : `${nickname}正在休息中`}
          </p>
        </div>
      )}
    </div>
  )
}

function StatRow({ icon: Icon, label, value, color, iconBg }: {
  icon: any; label: string; value: string; color: string; iconBg: string
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${color}`}>
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={15} />
      </div>
      <span className="text-xs font-medium flex-1">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  )
}
