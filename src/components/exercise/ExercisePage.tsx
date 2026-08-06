import { useState } from 'react'
import { useExercise } from '../../hooks/useExercise'
import { Plus, Trash2, Timer } from 'lucide-react'

export function ExercisePage() {
  const { records, loading, addRecord, deleteRecord } = useExercise()
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [duration, setDuration] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    addRecord({
      exercise_name: name.trim(),
      weight_kg: weight ? Number(weight) : null,
      reps: reps ? Number(reps) : null,
      sets: sets ? Number(sets) : null,
      duration_minutes: duration ? Number(duration) : null,
    })
    setName('')
    setWeight('')
    setReps('')
    setSets('')
    setDuration('')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">运动记录</h2>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="运动名称（如：哑铃肩推）"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">重量 (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="10"
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">次数</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="12"
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">组数</label>
            <input
              type="number"
              value={sets}
              onChange={e => setSets(e.target.value)}
              placeholder="3"
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">时间 (min)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="30"
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          添加运动记录
        </button>
      </div>

      {/* Records */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">加载中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">今天还没有运动记录 💪</p>
        ) : (
          records.map(record => (
            <div key={record.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 group">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Timer size={14} className="text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{record.exercise_name}</p>
                <p className="text-xs text-gray-400">
                  {[
                    record.weight_kg && `${record.weight_kg}kg`,
                    record.sets && record.reps && `${record.reps}×${record.sets}`,
                    record.duration_minutes && `${record.duration_minutes}min`,
                  ].filter(Boolean).join(' · ') || '无详情'}
                </p>
              </div>
              <button
                onClick={() => deleteRecord(record.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
