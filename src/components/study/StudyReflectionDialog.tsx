import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { StudySession } from '../../types'

interface Props {
  session: StudySession
  onClose: () => void
}

const FEELING_OPTIONS = ['很有收获', '状态不错', '有点累', '有点卡住']

export function StudyReflectionDialog({ session, onClose }: Props) {
  const { user } = useAuth()
  const [summary, setSummary] = useState(session.study_summary || '')
  const [reflection, setReflection] = useState(session.study_reflection || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!user || session.user_id !== user.id) {
      setError('只能记录自己的学习感想。')
      return
    }
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase
      .from('study_sessions')
      .update({
        study_summary: summary.trim() || null,
        study_reflection: reflection.trim() || null,
      })
      .eq('id', session.id)
      .eq('user_id', user.id)

    setSaving(false)
    if (updateError) {
      setError('保存失败，请确认学习记录的感想功能已完成初始化。')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="study-reflection-title">
      <button className="absolute inset-0 bg-gray-900/35" aria-label="跳过填写" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-teal-700">
              <BookOpen size={17} />
              <h3 id="study-reflection-title" className="text-base font-semibold">记录一下这次学习</h3>
            </div>
            <p className="mt-1 text-xs text-gray-400">计时已经结束，这里可选填，随时跳过。</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="跳过填写">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-600">
            这次学了什么？
            <textarea
              value={summary}
              onChange={event => setSummary(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="例如：完成了 2022 年英语阅读第 1 篇，整理了错题原因……"
              className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <div>
            <p className="text-xs font-medium text-gray-600">现在的状态或感想</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FEELING_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => setReflection(option)}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                    reflection === option ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <textarea
              value={reflection}
              onChange={event => setReflection(event.target.value)}
              maxLength={300}
              rows={2}
              placeholder="也可以写自己的感受，例如：长难句还是不够熟，需要明天再复盘。"
              className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50">跳过</button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? '保存中…' : '保存到学习记录'}
          </button>
        </div>
      </div>
    </div>
  )
}
