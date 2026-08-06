import { useState, useEffect } from 'react'
import { Target, X } from 'lucide-react'

const STORAGE_KEY = 'couple_study_target_date'
const DEFAULT_TARGET = '2026-12-26'

export function Countdown() {
  const [target, setTarget] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_TARGET)
  const [editing, setEditing] = useState(false)
  const [days, setDays] = useState(0)

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const targetDate = new Date(target + 'T00:00:00')
      const diff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      setDays(diff)
    }
    calc()
    const timer = setInterval(calc, 60000)
    return () => clearInterval(timer)
  }, [target])

  const save = (date: string) => {
    setTarget(date)
    localStorage.setItem(STORAGE_KEY, date)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 bg-white rounded-xl border border-teal-200 px-3 py-1.5">
        <Target size={14} className="text-teal-500 shrink-0" />
        <input
          type="date"
          value={target}
          onChange={e => save(e.target.value)}
          onBlur={() => setEditing(false)}
          className="text-xs border-none outline-none bg-transparent text-teal-700"
          autoFocus
        />
        <button onClick={() => setEditing(false)} className="text-gray-300 hover:text-gray-500">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-2 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer"
    >
      <Target size={16} className="text-teal-500" />
      <span className="text-xs text-gray-500">距离目标</span>
      <span className="text-sm font-bold text-teal-600">
        {days > 0 ? `${days}天` : days === 0 ? '今天' : '已过'}
      </span>
    </button>
  )
}
