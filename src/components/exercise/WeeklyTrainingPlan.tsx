import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Clock3, Dumbbell, Flame, HeartPulse, Minus, Plus, X } from 'lucide-react'
import { getLogicalDate } from '../../lib/date'
import type { ExerciseRecord } from '../../types'

export type ExercisePart = '胸部' | '背部' | '肩部' | '腿部' | '手臂' | '核心' | '有氧'

interface PlanItem {
  name: string
  sets: string
  rest: string
  cue: string
  part: ExercisePart
  duration?: number
}

interface PlanDay {
  label: string
  title: string
  focus: string
  duration: string
  kind: 'strength' | 'cardio' | 'recovery'
  note: string
  items: PlanItem[]
}

const PLAN_DAYS: PlanDay[] = [
  {
    label: '周一', title: '下肢 A', focus: '股四头肌、臀部、核心', duration: '50–60 分钟', kind: 'strength',
    note: '第一个正式动作前，先做 1 组轻量适应组，不计入正式组。',
    items: [
      { name: '保加利亚分腿蹲', sets: '4 × 10–15 / 侧', rest: '90 秒', cue: '抱 12kg 壶铃或两只 5kg 哑铃，3 秒下放。', part: '腿部' },
      { name: '脚跟垫高高脚杯深蹲', sets: '3 × 15–25', rest: '75 秒', cue: '抱 12kg 壶铃，膝上套环形带。', part: '腿部' },
      { name: '沙发臀推', sets: '4 × 15–25', rest: '60–75 秒', cue: '12kg 压髋，膝上套环形带，顶端停 2 秒。', part: '腿部' },
      { name: '下固定点弹力绳髋拉', sets: '3 × 12–20', rest: '60 秒', cue: '背对门，弹力绳从两腿间穿过，臀部向后坐。', part: '腿部' },
      { name: '单腿提踵', sets: '3 × 15–25 / 侧', rest: '45 秒', cue: '手持壶铃，顶端停 2 秒。', part: '腿部' },
      { name: '死虫', sets: '3 × 8–12 / 侧', rest: '45 秒', cue: '腰部贴地，缓慢呼气。', part: '核心' },
    ],
  },
  {
    label: '周二', title: '上肢 A', focus: '胸、背、肩部稳定、核心', duration: '45–55 分钟', kind: 'strength',
    note: '俯卧撑选第一组能完成 8–12 次、最后两次明显吃力但身体仍能保持直线的版本。',
    items: [
      { name: '俯卧撑', sets: '4 × 6–15', rest: '90 秒', cue: '墙面 → 高桌 → 沙发扶手 → 跪姿 → 标准 → 脚垫高，按能力选择。', part: '胸部' },
      { name: '弹力绳高位下拉', sets: '4 × 10–20', rest: '75 秒', cue: '固定门框上方，想象肘部向裤兜方向拉。', part: '背部' },
      { name: '弹力绳坐姿划船', sets: '3 × 12–20', rest: '75 秒', cue: '固定门框下方，稳定躯干后拉。', part: '背部' },
      { name: '半跪姿单臂推举', sets: '3 × 10–16 / 侧', rest: '75 秒', cue: '使用 5kg 哑铃，躯干保持稳定。', part: '肩部' },
      { name: '弹力绳面拉', sets: '3 × 15–25', rest: '60 秒', cue: '固定门框上方，拉向面部两侧。', part: '肩部' },
      { name: '侧桥', sets: '3 × 20–40 秒 / 侧', rest: '45 秒', cue: '自重，身体保持一条直线。', part: '核心' },
    ],
  },
  {
    label: '周三', title: '燃脂操', focus: '中高强度低冲击有氧', duration: '45 分钟', kind: 'cardio',
    note: '前 5 分钟低冲击热身，中间 35 分钟主训练，最后 5 分钟逐渐降低速度。大多数时间心率 125–140 次/分，主观强度约 6–7 / 10。',
    items: [
      { name: '45分钟燃脂操', sets: '45 分钟', rest: '—', cue: '开合跳改左右点步、跳跃深蹲改深蹲加提踵；多选拳击、侧步、摆臂和躯干转动。', part: '有氧', duration: 45 },
    ],
  },
  {
    label: '周四', title: '下肢 B', focus: '臀腿后侧、大腿内侧、核心', duration: '50–60 分钟', kind: 'strength',
    note: '硬拉太轻时，可把长弹力绳踩在前脚下并握住把手，与 12kg 壶铃共同增加阻力。',
    items: [
      { name: 'B站姿罗马尼亚硬拉', sets: '4 × 10–16 / 侧', rest: '90 秒', cue: '前脚承担约 80% 重量，抱 12kg 壶铃，4 秒下放。', part: '腿部' },
      { name: '长步幅后撤弓步', sets: '3 × 12–18 / 侧', rest: '90 秒', cue: '手持两只 5kg 哑铃，身体稍前倾。', part: '腿部' },
      { name: '单腿臀推', sets: '3 × 10–20 / 侧', rest: '75 秒', cue: '12kg 可放在工作侧髋部，顶端停 2 秒。', part: '腿部' },
      { name: '滑盘腿弯举', sets: '3 × 8–15', rest: '75 秒', cue: '臀部尽量不落地，缓慢伸腿。', part: '腿部' },
      { name: '环形带侧向行走', sets: '2–3 × 12–20 步 / 方向', rest: '45 秒', cue: '弹力带放在膝上或脚踝。', part: '腿部' },
      { name: '单侧负重原地踏步', sets: '3 × 30–45 秒 / 侧', rest: '45 秒', cue: '单手持 12kg，身体不能歪向一侧。', part: '核心' },
    ],
  },
  {
    label: '周五', title: '上肢 B', focus: '背、胸、手臂、健腹轮', duration: '45–55 分钟', kind: 'strength',
    note: '健腹轮只滚到腰部不会塌陷的位置。若控制不住，用死虫或平板支撑替代，不要靠塌腰增加距离。',
    items: [
      { name: '窄距或标准俯卧撑', sets: '4 × 6–15', rest: '90 秒', cue: '自重，选择可保持动作标准的版本。', part: '胸部' },
      { name: '单臂壶铃划船', sets: '4 × 10–18 / 侧', rest: '75 秒', cue: '使用 12kg 壶铃。', part: '背部' },
      { name: '弹力绳直臂下压', sets: '3 × 15–25', rest: '60 秒', cue: '固定门框上方，手臂基本伸直向下压。', part: '背部' },
      { name: 'Pike 俯卧撑', sets: '3 × 6–12', rest: '90 秒', cue: '自重，保持肩部发力和躯干稳定。', part: '肩部' },
      { name: '弹力绳三头下压', sets: '2–3 × 12–25', rest: '45–60 秒', cue: '固定门框上方。', part: '手臂' },
      { name: '哑铃旋后弯举', sets: '3 × 10–20', rest: '60 秒', cue: '每组做到 RIR 1–2；上举时旋后，控制下放。', part: '手臂' },
      { name: '健腹轮墙面限位', sets: '3 × 5–10', rest: '60 秒', cue: '跪姿面向墙；3 组均可完成 10 次后，膝盖向后移 5–10cm。', part: '核心' },
    ],
  },
  {
    label: '周六', title: '燃脂操', focus: '低冲击有氧 / 上肢参与更多', duration: '45 分钟', kind: 'cardio',
    note: '按周三的 45 分钟标准执行。若腿部仍酸痛，选拳击操、低冲击有氧或上肢参与更多的版本。',
    items: [
      { name: '45分钟燃脂操', sets: '45 分钟', rest: '—', cue: '状态好可比周三稍活跃；避免大量深蹲跳、弓步跳，以免影响下肢恢复。', part: '有氧', duration: 45 },
    ],
  },
  {
    label: '周日', title: '恢复日', focus: '活动度与恢复', duration: '休息或拉伸 10 分钟', kind: 'recovery',
    note: '不安排正式训练，也不要求快走。饮食控制在 1400–1450 kcal，蛋白质约 100g。',
    items: [
      { name: '髋屈肌拉伸', sets: '每侧 30 秒 × 2', rest: '—', cue: '温和拉伸，不追求疼痛感。', part: '腿部' },
      { name: '小腿拉伸', sets: '每侧 30 秒 × 2', rest: '—', cue: '保持自然呼吸。', part: '腿部' },
      { name: '胸椎旋转', sets: '每侧 8 次', rest: '—', cue: '动作缓慢，保持骨盆稳定。', part: '核心' },
      { name: '猫牛式', sets: '10 次', rest: '—', cue: '配合呼吸活动脊柱。', part: '核心' },
      { name: '90/90 髋部转换', sets: '每侧 8 次', rest: '—', cue: '控制髋部移动。', part: '腿部' },
      { name: '胸肩拉伸', sets: '每侧 30 秒', rest: '—', cue: '放松呼吸。', part: '肩部' },
    ],
  },
]

const PROGRESSION = [
  '第 1 周：每个动作少 1 组，RIR 保持 3，熟悉动作。',
  '第 2 周：完成全部组数，RIR 约 2。',
  '第 3 周：每组增加 1–3 次，动作仍要标准。',
  '第 4 周：达到次数上限时，加弹力、停顿或慢速下放。',
  '第 5 周：减量周，所有动作减少约三分之一组数，RIR 3–4。',
  '第 6 周：恢复第 4 周训练量，争取超过原次数。',
  '第 7 周：主要动作换更难版本或增加弹力阻力。',
  '第 8 周：保持组数，在标准动作前提下创造次数纪录。',
]

interface Props {
  onSelectExercise: (name: string, part: ExercisePart, duration?: number) => void
  records: ExerciseRecord[]
  onAddSet: (record: Omit<ExerciseRecord, 'id' | 'user_id' | 'date' | 'created_at'>) => Promise<ExerciseRecord | null>
}

function getCurrentPlanDay() {
  return (getLogicalDate().getDay() + 6) % 7
}

function parseSetPlan(sets: string) {
  const match = sets.match(/^(\d+)(?:–(\d+))?\s*×\s*(\d+)(?:–(\d+))?/)
  if (!match) return null
  const totalSets = Number(match[2] || match[1])
  const minReps = Number(match[3])
  const maxReps = Number(match[4] || match[3])
  return { totalSets, minReps, maxReps }
}

function PlannedSetTracker({ item, records, onAddSet }: { item: PlanItem; records: ExerciseRecord[]; onAddSet: Props['onAddSet'] }) {
  const plan = parseSetPlan(item.sets)
  const [openSet, setOpenSet] = useState<number | null>(null)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!plan) return null
  const itemRecords = records.filter(record => record.exercise_name === item.name)
  const completedCount = Math.min(itemRecords.length, plan.totalSets)

  const openRecorder = (setIndex: number) => {
    if (setIndex < completedCount || setIndex > completedCount) return
    const lastRecord = itemRecords[itemRecords.length - 1]
    const suggestedReps = lastRecord?.reps || Math.round((plan.minReps + plan.maxReps) / 2)
    setReps(String(suggestedReps))
    setWeight(lastRecord?.weight_kg ? String(lastRecord.weight_kg) : '')
    setError('')
    setOpenSet(setIndex)
  }

  const saveSet = async () => {
    if (openSet === null || !reps) return
    setSaving(true)
    setError('')
    const saved = await onAddSet({
      exercise_name: item.name,
      weight_kg: weight ? Number(weight) : null,
      reps: Number(reps),
      sets: 1,
      duration_minutes: null,
    })
    setSaving(false)
    if (!saved) {
      setError('这一组暂时没有保存成功，请再试一次。')
      return
    }
    setOpenSet(null)
  }

  const changeReps = (delta: number) => {
    const current = Number(reps) || Math.round((plan.minReps + plan.maxReps) / 2)
    setReps(String(Math.min(plan.maxReps, Math.max(plan.minReps, current + delta))))
  }

  return (
    <div className="mt-1.5 flex items-center justify-end gap-2">
      <div className="flex items-center gap-1.5" aria-label={`${item.name}：已完成 ${completedCount} / ${plan.totalSets} 组`}>
        {Array.from({ length: plan.totalSets }, (_, index) => {
          const completed = index < completedCount
          const nextSet = index === completedCount
          const record = itemRecords[index]
          return (
            <button
              key={index}
              onClick={() => openRecorder(index)}
              disabled={completed || !nextSet}
              title={completed ? `第 ${index + 1} 组：${record?.weight_kg || '自重'}${record?.weight_kg ? 'kg × ' : ' × '}${record?.reps || '—'} 次` : `记录第 ${index + 1} 组`}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors ${
                completed
                  ? 'cursor-default border-emerald-500 bg-emerald-500 text-white'
                  : nextSet
                    ? 'border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'cursor-not-allowed border-stone-200 bg-stone-50 text-stone-300'
              }`}
            >
              {completed ? <Check size={14} strokeWidth={3} /> : index + 1}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-gray-400 whitespace-nowrap">{completedCount}/{plan.totalSets} 组</p>

      {openSet !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="set-recorder-title">
          <button className="absolute inset-0 bg-gray-900/30" onClick={() => setOpenSet(null)} aria-label="取消记录本组" />
          <div className="relative w-full max-w-sm rounded-2xl border border-emerald-100 bg-[#fffdf8] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-emerald-700">{item.name}</p>
                <h4 id="set-recorder-title" className="mt-0.5 text-lg font-bold text-gray-900">记录第 {openSet + 1} 组</h4>
              </div>
              <button onClick={() => setOpenSet(null)} disabled={saving} className="rounded-lg p-1.5 text-gray-400 hover:bg-stone-100 hover:text-gray-600" aria-label="取消记录本组"><X size={18} /></button>
            </div>

            <div className="mt-4 grid grid-cols-[72px_1fr] gap-3">
              <div className="flex h-20 flex-col items-center justify-center rounded-xl bg-emerald-600 text-white">
                <span className="text-2xl font-bold">{openSet + 1}</span>
                <span className="text-[10px] font-medium">第 {openSet + 1} 组</span>
              </div>
              <div className="rounded-xl border border-stone-100 bg-white p-2.5">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>次数</span><span>计划 {plan.minReps}–{plan.maxReps} 次</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <button onClick={() => changeReps(-1)} disabled={Number(reps) <= plan.minReps} className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-35"><Minus size={15} /></button>
                  <span className="text-xl font-bold text-gray-900">{reps}<span className="ml-1 text-xs font-medium text-gray-400">次</span></span>
                  <button onClick={() => changeReps(1)} disabled={Number(reps) >= plan.maxReps} className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-35"><Plus size={15} /></button>
                </div>
              </div>
            </div>

            <label className="mt-3 block text-[11px] font-medium text-gray-500">
              重量 kg <span className="font-normal text-gray-300">（不填即自重）</span>
              <input type="number" min="0" step="0.5" value={weight} onChange={event => setWeight(event.target.value)} placeholder="自重" className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-base text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>
            {error && <p className="mt-2 text-[11px] text-rose-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpenSet(null)} disabled={saving} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-stone-100">取消</button>
              <button onClick={saveSet} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? '保存中…' : '完成本组'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function WeeklyTrainingPlan({ onSelectExercise, records, onAddSet }: Props) {
  const [selectedDay, setSelectedDay] = useState(getCurrentPlanDay)
  const [showGuidance, setShowGuidance] = useState(false)
  const day = PLAN_DAYS[selectedDay]
  const isRecovery = day.kind === 'recovery'

  return (
    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">每周训练计划</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">点动作名称可带入下方记录栏；右侧圆圈用于逐组记录。</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-emerald-700 shadow-sm">
          <Clock3 size={13} /> 今天：{PLAN_DAYS[getCurrentPlanDay()].label}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {PLAN_DAYS.map((planDay, index) => (
          <button
            key={planDay.label}
            onClick={() => setSelectedDay(index)}
            className={`rounded-xl px-1 py-2 text-center text-[11px] font-medium transition-colors ${
              selectedDay === index ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-emerald-100'
            }`}
          >
            {planDay.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              {day.kind === 'cardio' ? <Flame size={17} className="text-orange-500" /> : day.kind === 'recovery' ? <HeartPulse size={17} className="text-sky-500" /> : <Dumbbell size={17} className="text-emerald-600" />}
              <h3 className="text-base font-semibold text-gray-900">{day.label} · {day.title}</h3>
            </div>
            <p className="mt-1 text-xs text-gray-500">重点：{day.focus}</p>
          </div>
          <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">{day.duration}</span>
        </div>

        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">{day.note}</p>

        <div className="mt-3 space-y-2">
          {day.items.map((item) => (
            <div
              key={item.name}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                isRecovery ? 'border-gray-100 bg-gray-50/70' : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => !isRecovery && onSelectExercise(item.name, item.part, item.duration)} disabled={isRecovery} className={`min-w-0 text-left ${isRecovery ? 'cursor-default' : 'group'}`}>
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className={`mt-0.5 text-[10px] leading-4 text-gray-400 ${isRecovery ? '' : 'group-hover:text-emerald-700'}`}>{item.cue}</p>
                </button>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-emerald-700">{item.sets}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">休息 {item.rest}</p>
                  {!isRecovery && <PlannedSetTracker item={item} records={records} onAddSet={onAddSet} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => setShowGuidance(open => !open)} className="mt-3 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-white/70 hover:text-gray-700">
        <span>训练强度、热身与 8 周递进</span>
        {showGuidance ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {showGuidance && (
        <div className="mt-1 space-y-3 rounded-xl bg-white/70 p-3 text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-700">强度与动作节奏</p>
            <p className="mt-1 leading-5">正式组大多做到 RIR 1–2；默认节奏为下放 3 秒、顶峰收缩停 1 秒、起身或拉回 1 秒。若仍太轻，依次增加弹力阻力、下放时间、底部停顿、单侧动作、1.5 次动作、幅度或背包加重。</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">每次力量训练热身（1–2 轮，共 5–7 分钟）</p>
            <p className="mt-1 leading-5">原地踏步 60 秒、徒手深蹲 10 次、徒手髋铰链 10 次、臀桥 12 次、后撤弓步每侧 6 次、肩胛俯卧撑 8–10 次、弹力带拉开 15 次。</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">8 周递进</p>
            <div className="mt-2 grid gap-1.5 md:grid-cols-2">
              {PROGRESSION.map(step => <p key={step} className="rounded-md bg-stone-50 px-2.5 py-2 leading-4">{step}</p>)}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
