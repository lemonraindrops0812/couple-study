import { useNavigate } from 'react-router-dom'
import type { Task } from '../../types'
import { Check, Circle, ArrowRight } from 'lucide-react'

interface Props {
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
}

export function TodayTasks({ tasks, onToggle }: Props) {
  const navigate = useNavigate()
  const done = tasks.filter(t => t.completed).length
  const total = tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">今日任务</h3>
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 transition-colors"
        >
          查看全部 <ArrowRight size={12} />
        </button>
      </div>

      {/* Completion bar */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-2xl font-bold text-gray-900">{done}</span>
          <span className="text-sm text-gray-400">/ {total}</span>
          <span className="ml-auto text-sm font-medium text-teal-600">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">今天还没有任务</p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {tasks.slice(0, 6).map(task => (
            <div key={task.id} className="flex items-center gap-2 py-1.5 group">
              <button onClick={() => onToggle(task.id, !task.completed)} className="shrink-0">
                {task.completed ? (
                  <Check size={16} className="text-teal-500" />
                ) : (
                  <Circle size={16} className="text-gray-300 group-hover:text-gray-400" />
                )}
              </button>
              <span className={`flex-1 text-xs truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
