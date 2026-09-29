import { useState, useMemo, useEffect } from 'react'
import { useExercise } from '../../hooks/useExercise'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Plus, Trash2, Timer, Clock, Dumbbell, ChevronDown, ChevronUp, History, Play, Pause } from 'lucide-react'
import type { ExerciseRecord } from '../../types'
import { WeeklyTrainingPlan, type ExercisePart } from './WeeklyTrainingPlan'

const EXERCISE_LIBRARY: Record<string, { name: string; icon: string }[]> = {
  '胸部': [
    { name: '杠铃卧推', icon: '🏋️' }, { name: '哑铃卧推', icon: '🏋️' }, { name: '上斜卧推', icon: '🏋️' },
    { name: '哑铃飞鸟', icon: '🕊️' }, { name: '绳索夹胸', icon: '🪢' }, { name: '双杠臂屈伸', icon: '💪' },
    { name: '俯卧撑', icon: '🤸' },
  ],
  '背部': [
    { name: '引体向上', icon: '🧗' }, { name: '杠铃划船', icon: '🏋️' }, { name: '哑铃划船', icon: '🏋️' },
    { name: '高位下拉', icon: '⬇️' }, { name: '坐姿划船', icon: '🚣' }, { name: '硬拉', icon: '🏋️' },
    { name: '山羊挺身', icon: '🐐' },
  ],
  '肩部': [
    { name: '哑铃肩推', icon: '🏋️' }, { name: '杠铃推举', icon: '🏋️' }, { name: '侧平举', icon: '🪽' },
    { name: '前平举', icon: '🫳' }, { name: '面拉', icon: '🧵' }, { name: '阿诺德推举', icon: '🏋️' },
  ],
  '腿部': [
    { name: '杠铃深蹲', icon: '🏋️' }, { name: '腿举', icon: '🦵' }, { name: '腿弯举', icon: '🦵' },
    { name: '腿屈伸', icon: '🦵' }, { name: '罗马尼亚硬拉', icon: '🏋️' }, { name: '保加利亚分腿蹲', icon: '🦵' },
    { name: '提踵', icon: '🦶' }, { name: '脚跟垫高高脚杯深蹲', icon: '🦵' }, { name: '沙发臀推', icon: '🍑' },
    { name: '下固定点弹力绳髋拉', icon: '🪢' }, { name: 'B站姿罗马尼亚硬拉', icon: '🏋️' }, { name: '长步幅后撤弓步', icon: '🦵' },
    { name: '单腿臀推', icon: '🍑' }, { name: '滑盘腿弯举', icon: '🦵' }, { name: '环形带侧向行走', icon: '🚶' },
  ],
  '手臂': [
    { name: '杠铃弯举', icon: '💪' }, { name: '哑铃弯举', icon: '💪' }, { name: '锤式弯举', icon: '🔨' },
    { name: '绳索下压', icon: '🪢' }, { name: '窄距卧推', icon: '🏋️' }, { name: '臂屈伸', icon: '💪' }, { name: '哑铃旋后弯举', icon: '💪' },
  ],
  '核心': [
    { name: '卷腹', icon: '🔄' }, { name: '平板支撑', icon: '🪵' }, { name: '俄罗斯转体', icon: '🇷🇺' },
    { name: '悬垂举腿', icon: '🦵' }, { name: '仰卧起坐', icon: '🛌' }, { name: '死虫', icon: '🐞' },
    { name: '侧桥', icon: '🪵' }, { name: '单侧负重原地踏步', icon: '🚶' }, { name: '健腹轮墙面限位', icon: '🛞' },
  ],
  '有氧': [
    { name: '跑步', icon: '🏃' }, { name: '跳绳', icon: '🪢' }, { name: '单车', icon: '🚴' },
    { name: '椭圆机', icon: '🏃' }, { name: '游泳', icon: '🏊' }, { name: '45分钟燃脂操', icon: '🔥' },
  ],
}

const BODY_PARTS = Object.keys(EXERCISE_LIBRARY)

export function ExercisePage() {
  const { user } = useAuth()
  const { records, loading, addRecord, deleteRecord } = useExercise()
  const [selectedPart, setSelectedPart] = useState('胸部')
  const [exerciseName, setExerciseName] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [duration, setDuration] = useState('')
  const [showLibrary, setShowLibrary] = useState(false)

  // Timer
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [timerDisplay, setTimerDisplay] = useState(0)

  // History
  const [history, setHistory] = useState<Record<string, ExerciseRecord[]>>({})
  useEffect(() => {
    if (!user) return
    supabase.from('exercise_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => {
        const map: Record<string, ExerciseRecord[]> = {}
        ;(data as ExerciseRecord[])?.forEach(r => { if (!map[r.exercise_name]) map[r.exercise_name] = []; map[r.exercise_name].push(r) })
        setHistory(map)
      })
  }, [user, records])

  useEffect(() => {
    if (!timerRunning || timerDisplay <= 0) return
    const t = setInterval(() => setTimerDisplay(prev => prev <= 1 ? (setTimerRunning(false), 0) : prev - 1), 1000)
    return () => clearInterval(t)
  }, [timerRunning, timerDisplay])

  const startTimer = (secs?: number) => {
    setTimerDisplay(secs || timerSeconds)
    setTimerRunning(true)
  }

  const selectExercise = (name: string, part?: ExercisePart, suggestedDuration?: number) => {
    setExerciseName(name)
    if (part) setSelectedPart(part)
    if (suggestedDuration) setDuration(String(suggestedDuration))
    else if (part) setDuration('')
    setShowLibrary(false)
    const last = history[name]?.[0]
    if (last?.weight_kg) setWeight(String(last.weight_kg))
    if (last?.reps) setReps(String(last.reps))
  }

  // ONE CLICK = ONE SET
  const handleAddOneSet = () => {
    if (!exerciseName.trim()) return
    addRecord({
      exercise_name: exerciseName.trim(),
      weight_kg: weight ? Number(weight) : null,
      reps: reps ? Number(reps) : null,
      sets: 1, // always 1 set per row
      duration_minutes: duration ? Number(duration) : null,
    })
    // Clear reps only, keep weight for next set (usually same weight)
    setReps('')
  }

  // Group by exercise name (each row = one set)
  const grouped = useMemo(() => {
    const map: Record<string, ExerciseRecord[]> = {}
    records.forEach(r => {
      if (!map[r.exercise_name]) map[r.exercise_name] = []
      map[r.exercise_name].push(r)
    })
    return map
  }, [records])

  const totalSets = records.length // each row = one set now
  const totalMinutes = records.reduce((s, r) => s + (r.duration_minutes || 0), 0)
  const totalWeight = records.reduce((s, r) => s + ((r.weight_kg || 0) * (r.reps || 0)), 0)

  const fmtTime = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">运动记录</h2>

      <WeeklyTrainingPlan onSelectExercise={selectExercise} records={records} onAddSet={addRecord} />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '训练动作', value: Object.keys(grouped).length, icon: Dumbbell },
          { label: '总组数', value: totalSets, icon: Timer },
          { label: '总时长', value: `${totalMinutes}min`, icon: Clock },
          { label: '总容量', value: `${(totalWeight / 1000).toFixed(1)}t`, icon: Dumbbell },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <s.icon size={14} className="mx-auto mb-1 text-teal-500" />
            <p className="text-sm font-bold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rest Timer */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500">组间休息</h3>
          <div className="flex items-center gap-2">
            {[30, 60, 90, 120].map(s => (
              <button key={s} onClick={() => { setTimerSeconds(s); setTimerRunning(false); setTimerDisplay(0) }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${timerSeconds === s && !timerRunning ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                {s}s
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-mono font-bold text-gray-900">{timerRunning && timerDisplay > 0 ? fmtTime(timerDisplay) : fmtTime(timerSeconds)}</div>
          <button onClick={() => timerRunning ? setTimerRunning(false) : startTimer()}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${timerRunning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
            {timerRunning ? <><Pause size={14} className="inline mr-1" />停止</> : <><Play size={14} className="inline mr-1" />开始</>}
          </button>
          {timerRunning && <button onClick={() => { setTimerRunning(false); setTimerDisplay(0) }} className="text-xs text-gray-400 hover:text-gray-600">重置</button>}
        </div>
      </div>

      {/* Add Form — per-set recording */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {BODY_PARTS.map(part => (
            <button key={part} onClick={() => setSelectedPart(part)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedPart === part ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              {part}
            </button>
          ))}
        </div>

        <div className="relative">
          <button onClick={() => setShowLibrary(!showLibrary)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 text-sm hover:border-teal-300 transition-colors">
            <span className={exerciseName ? 'text-gray-900 font-medium' : 'text-gray-400'}>{exerciseName || '选择动作...'}</span>
            {showLibrary ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
          </button>
          {showLibrary && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {EXERCISE_LIBRARY[selectedPart].map(ex => (
                  <button key={ex.name} onClick={() => selectExercise(ex.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${exerciseName === ex.name ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span>{ex.icon}</span>{ex.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <NutField label="重量 kg" value={weight} onChange={setWeight} />
          <NutField label="次数" value={reps} onChange={setReps} />
          <NutField label="时长 min" value={duration} onChange={setDuration} />
        </div>

        {exerciseName && history[exerciseName]?.[0] && (
          <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <History size={12} />
            上次：{history[exerciseName][0].weight_kg}kg × {history[exerciseName][0].reps}次
          </div>
        )}

        <button onClick={handleAddOneSet} disabled={!exerciseName.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors">
          <Plus size={16} />添加一组
        </button>
        <p className="text-center text-[10px] text-gray-400">
          力量动作每点一次记录<strong>一组</strong>；有氧填入总时长后记录一次
        </p>
      </div>

      {/* Records grouped by exercise */}
      {loading ? (
        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Dumbbell size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">今天还没有运动记录</p>
          <p className="text-xs text-gray-300 mt-1">开始训练吧 💪</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([name, items]) => {
            const excVol = items.reduce((s, r) => s + (r.weight_kg || 0) * (r.reps || 0), 0)
            let part = ''
            for (const [p, exs] of Object.entries(EXERCISE_LIBRARY)) {
              if (exs.some(e => e.name === name)) { part = p; break }
            }
            return (
              <div key={name} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-sm">
                    {EXERCISE_LIBRARY[part]?.find(e => e.name === name)?.icon || '💪'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{name}</p>
                    <p className="text-[10px] text-gray-400">{items.length}组 · {excVol}kg 总容量</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 group hover:bg-gray-50/50 transition-colors">
                      <span className="text-[10px] text-gray-300 w-8 shrink-0">第{idx + 1}组</span>
                      <div className="flex-1 flex items-center gap-3">
                        {item.weight_kg && <span className="text-sm font-mono font-medium text-gray-700">{item.weight_kg}<span className="text-[10px] text-gray-400">kg</span></span>}
                        {item.reps && <span className="text-sm font-mono text-gray-500">×{item.reps}</span>}
                        {item.duration_minutes && <span className="text-xs text-gray-400">{item.duration_minutes}min</span>}
                      </div>
                      <button onClick={() => deleteRecord(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NutField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-400 mb-0.5">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        placeholder="0" className="w-full px-2 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
    </div>
  )
}
