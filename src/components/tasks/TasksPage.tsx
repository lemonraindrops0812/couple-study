import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { Plus, Trash2, Check, Circle, Clock } from 'lucide-react'

const CATEGORIES = ['学习', '生活', '运动', '其他']
const CATEGORY_COLORS: Record<string, string> = {
  '学习': 'bg-blue-100 text-blue-700',
  '生活': 'bg-green-100 text-green-700',
  '运动': 'bg-orange-100 text-orange-700',
  '其他': 'bg-gray-100 text-gray-600',
}

export function TasksPage() {
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks()
  const [newTitle, setNewTitle] = useState('')
  const [category, setCategory] = useState('学习')
  const [estimatedMin, setEstimatedMin] = useState('')

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addTask(newTitle.trim(), category, estimatedMin ? Number(estimatedMin) : undefined)
    setNewTitle('')
    setEstimatedMin('')
  }

  const completedCount = tasks.filter(t => t.completed).length
  const totalEstimated = tasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)
  const doneEstimated = tasks.filter(t => t.completed).reduce((s, t) => s + (t.estimated_minutes || 0), 0)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">今日任务</h2>
        <span className="text-sm text-gray-500">
          {completedCount}/{tasks.length} 完成
          {totalEstimated > 0 && <span className="text-gray-300 ml-1">· {doneEstimated}/{totalEstimated}min</span>}
        </span>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${(completedCount / tasks.length) * 100}%` }} />
        </div>
      )}

      {/* Add task */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="添加新任务..."
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-2">
          <div className="flex gap-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  category === cat ? CATEGORY_COLORS[cat] : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Clock size={12} className="absolute left-2.5 top-2.5 text-gray-300" />
            <input
              type="number"
              value={estimatedMin}
              onChange={e => setEstimatedMin(e.target.value)}
              placeholder="预计分钟"
              className="w-full pl-7 pr-2 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button onClick={handleAdd} className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">加载中...</p>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-400">今天还没有任务</p>
            <p className="text-xs text-gray-300 mt-1">添加一个开始规划今天 ✨</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 group hover:border-gray-200 transition-colors">
              <button onClick={() => toggleTask(task.id, !task.completed)} className="shrink-0">
                {task.completed ? <Check size={20} className="text-teal-500" /> : <Circle size={20} className="text-gray-300 group-hover:text-gray-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm block truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.category && (
                    <span className={`text-[10px] px-1.5 py-0 rounded-full ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS['其他']}`}>
                      {task.category}
                    </span>
                  )}
                  {task.estimated_minutes && (
                    <span className="text-[10px] text-gray-400">{task.estimated_minutes}min</span>
                  )}
                </div>
              </div>
              <button onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
