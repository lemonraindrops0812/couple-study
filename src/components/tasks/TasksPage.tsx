import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { Plus, Trash2, Check, Circle } from 'lucide-react'

export function TasksPage() {
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks()
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addTask(newTitle.trim())
    setNewTitle('')
  }

  const completedCount = tasks.filter(t => t.completed).length

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">今日任务</h2>
        <span className="text-sm text-gray-500">
          {completedCount}/{tasks.length} 完成
        </span>
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="添加新任务..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">加载中...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">今天还没有任务，添加一个吧 ✨</p>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 group hover:border-gray-200 transition-colors"
            >
              <button onClick={() => toggleTask(task.id, !task.completed)} className="shrink-0">
                {task.completed ? (
                  <Check size={20} className="text-teal-500" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
              </button>
              <span className={`flex-1 text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
