import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getToday } from '../../lib/date'
import { useAuth } from '../../hooks/useAuth'
import type { StudySession } from '../../types'

interface Props {
  session: StudySession
  onClose: () => void
  onSaved: (session: StudySession) => void
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const part = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`
}

export function StudySessionEditor({ session, onClose, onSaved }: Props) {
  const { user } = useAuth()
  const [startValue, setStartValue] = useState(() => toDateTimeLocal(session.start_time))
  const [endValue, setEndValue] = useState(() => toDateTimeLocal(session.end_time || session.start_time))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!user || session.user_id !== user.id) {
      setError('只能修改自己的学习记录。')
      return
    }
    if (!session.end_time) {
      setError('正在计时的学习不能在这里修改，请先正常结束学习。')
      return
    }

    const start = new Date(startValue)
    const end = new Date(endValue)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('请填写完整的开始和结束时间。')
      return
    }
    if (end.getTime() <= start.getTime()) {
      setError('结束时间需要晚于开始时间。')
      return
    }

    setSaving(true)
    setError('')
    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
    const { data, error: updateError } = await supabase
      .from('study_sessions')
      .update({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: durationMinutes,
        // Keep time-based statistics in the logical study day of the session's start.
        date: getToday(start),
      })
      .eq('id', session.id)
      .eq('user_id', user.id)
      .select()
      .single()

    setSaving(false)
    if (updateError || !data) {
      setError(`保存失败：${updateError?.message || '未找到这条记录'}`)
      return
    }
    onSaved(data as StudySession)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-study-title">
      <button className="absolute inset-0 bg-gray-900/35" aria-label="关闭" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 id="edit-study-title" className="text-base font-semibold text-gray-900">调整学习时间</h3>
            <p className="mt-0.5 text-xs text-gray-400 truncate">{session.subject}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-600">
            开始时间
            <input
              type="datetime-local"
              value={startValue}
              onChange={event => setStartValue(event.target.value)}
              step="60"
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            结束时间
            <input
              type="datetime-local"
              value={endValue}
              onChange={event => setEndValue(event.target.value)}
              step="60"
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>

        <p className="mt-3 text-[11px] leading-5 text-gray-400">时长和当天统计会按这里的起止时间自动重新计算；不会影响任何正在计时的学习。</p>
        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50">取消</button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? '保存中…' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  )
}
