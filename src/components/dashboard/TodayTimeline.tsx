import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { Trash2 } from 'lucide-react'

interface Props { data: StudyAnalytics; onDelete: (id: string) => void }

export function TodayTimeline({ data, onDelete }: Props) {
  if (!data.todayTimeline.length) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">📋 今日学习记录</h3>

      <div className="space-y-2">
        {data.todayTimeline.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0 group">
            <span className="text-[11px] text-gray-400 w-12 shrink-0">{item.time}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-700">{item.subject}</span>
            </div>
            <span className="text-[11px] text-gray-400 shrink-0">{item.duration}min</span>
            <span className="text-[10px] text-gray-300 shrink-0 w-12 text-right">{item.nickname}</span>
            <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
