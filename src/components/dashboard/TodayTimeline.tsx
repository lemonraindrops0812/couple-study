import { useState } from 'react'
import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { StudySessionEditor } from '../study/StudySessionEditor'
import type { StudySession } from '../../types'

interface Props { data: StudyAnalytics; onDelete: (id: string) => void; onUpdated: () => void; dateLabel?: string }

function formatTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function TodayTimeline({ data, onDelete, onUpdated, dateLabel = '所选日' }: Props) {
  const { user } = useAuth()
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">📋 {dateLabel}学习记录</h3>

      {data.todayTimeline.length ? <div className="space-y-2">
        {data.todayTimeline.map((item) => (
          <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0 group">
            <span className="text-[11px] text-gray-400 w-[82px] shrink-0">{formatTime(item.start_time)}–{formatTime(item.end_time)}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-700">{item.subject}</span>
              {(item.study_summary || item.study_reflection) && (
                <div className="mt-1.5 space-y-1 rounded-lg bg-amber-50/70 px-2.5 py-2 text-[11px] leading-4 text-stone-600">
                  {item.study_summary && <p><span className="font-medium text-amber-700">学了：</span>{item.study_summary}</p>}
                  {item.study_reflection && <p><span className="font-medium text-amber-700">状态：</span>{item.study_reflection}</p>}
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-400 shrink-0">{item.duration_minutes || 0}min</span>
            <span className="text-[10px] text-gray-300 shrink-0 w-12 text-right">{item.nickname}</span>
            {item.user_id === user?.id && (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditingSession(item)} className="text-gray-300 hover:text-teal-600 transition-colors" title="修改时间" aria-label="修改时间">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="删除记录" aria-label="删除记录">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div> : (
        <p className="text-center py-5 text-xs text-gray-400">这一天还没有学习记录</p>
      )}
      {editingSession && (
        <StudySessionEditor
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={() => { setEditingSession(null); onUpdated() }}
        />
      )}
    </div>
  )
}
