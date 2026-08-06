import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { useStudyAnalytics } from '../../hooks/useStudyAnalytics'
import { useTasks } from '../../hooks/useTasks'
import { UserStatusCard } from './UserStatusCard'
import { TodayTasks } from './TodayTasks'
import { FocusStatus } from './FocusStatus'
import { DietSummary } from './DietSummary'
import { ExerciseSummary } from './ExerciseSummary'
import { MoodCard } from './MoodCard'
import { WeeklyTrend } from './WeeklyTrend'
import { Countdown } from './Countdown'
import { GrowthTree } from './GrowthTree'
import { CoupleZone } from './CoupleZone'
import { Bell, CalendarDays, Sparkles, Pencil, X } from 'lucide-react'
import { StudyOverviewCard } from './StudyOverviewCard'
import { StudyTrendChart } from './StudyTrendChart'
import { StudyHeatmap } from './StudyHeatmap'
import { SubjectDistribution } from './SubjectDistribution'
import { FocusAnalysis } from './FocusAnalysis'
import { GoalProgress } from './GoalProgress'
import { DualGrowth } from './DualGrowth'
import { TodayTimeline } from './TodayTimeline'

const DEFAULT_GREETINGS = [
  '今天也一起努力吧 🌱',
  '每一步都算数 ✨',
  '为更好的我们努力 💪',
  '今天比昨天多学一点点 📚',
  '距离梦想又近了一步 🎯',
  '坚持就是胜利 🏆',
  '今天的努力是明天的底气 🌟',
  '和你一起成长真好 💕',
]

const STORAGE_KEY = 'couple_greetings'

function loadGreetings(): string[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) { const arr = JSON.parse(s); if (arr.length > 0) return arr }
  } catch {}
  return [...DEFAULT_GREETINGS]
}

function saveGreetings(arr: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}

function formatDate() {
  const now = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
}

export function DashboardPage() {
  const { user, partner, liveActivity, partnerActivity } = useAuth()
  const { data: dashData } = useDashboard()
  const { data: studyData, loading: studyLoading, deleteSession } = useStudyAnalytics()
  const { tasks, toggleTask } = useTasks()

  const [greetings, setGreetings] = useState(loadGreetings)
  const [editGreetings, setEditGreetings] = useState(false)
  const [newGreeting, setNewGreeting] = useState('')
  const [greeting] = useState(() => {
    const list = greetings.length > 0 ? greetings : DEFAULT_GREETINGS
    return list[Math.floor(Math.random() * list.length)]
  })

  const addGreeting = () => {
    const g = newGreeting.trim()
    if (!g) return
    const next = [...greetings, g]
    setGreetings(next); saveGreetings(next); setNewGreeting('')
  }
  const removeGreeting = (i: number) => {
    const next = greetings.filter((_, idx) => idx !== i)
    setGreetings(next); saveGreetings(next)
  }
  const resetGreetings = () => {
    setGreetings([...DEFAULT_GREETINGS]); saveGreetings([...DEFAULT_GREETINGS])
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Warm Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={22} className="text-amber-400" />
            今日一起成长
          </h2>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} /> {formatDate()} ·
            <span className="text-amber-500">{greeting}</span>
            <button onClick={() => { setEditGreetings(!editGreetings); setNewGreeting('') }}
              className="text-stone-300 hover:text-amber-500 transition-colors ml-1">
              <Pencil size={12} />
            </button>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Countdown />
          <button className="relative p-2 rounded-xl hover:bg-amber-50 transition-colors">
            <Bell size={18} className="text-amber-400" />
          </button>
        </div>
      </div>

      {/* ── Greeting Editor ── */}
      {editGreetings && (
        <div className="bg-white rounded-2xl border border-amber-100 p-4 space-y-3" style={{ background: 'linear-gradient(135deg, #fffdf7 0%, #fefce8 100%)' }}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-stone-600">编辑每日文案</h4>
            <button onClick={resetGreetings} className="text-[10px] text-stone-400 hover:text-stone-600">恢复默认</button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {greetings.map((g, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <span className="text-xs text-stone-600 flex-1">{g}</span>
                <button onClick={() => removeGreeting(i)}
                  className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newGreeting} onChange={e => setNewGreeting(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGreeting()}
              placeholder="添加一句..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button onClick={addGreeting} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs">添加</button>
          </div>
        </div>
      )}

      {/* ── 三人行 ── */}
      <div className="grid grid-cols-3 gap-4">
        {user && <UserStatusCard userId={user.id} nickname={user.nickname} avatarUrl={user.avatar_url} isMe liveActivity={liveActivity} streakDays={studyData.streakDays} />}
        <div className="space-y-4">
          <CoupleZone data={studyData} />
          <GrowthTree streakDays={studyData.streakDays} maxStreak={studyData.maxStreak} totalDays={studyData.totalDays90} />
        </div>
        {partner && <UserStatusCard userId={partner.id} nickname={partner.nickname} avatarUrl={partner.avatar_url} isMe={false} liveActivity={partnerActivity} streakDays={studyData.partnerStreakDays} />}
      </div>

      <FocusStatus />

      {!studyLoading && (
        <>
          <StudyOverviewCard data={studyData} />
          <div className="grid grid-cols-2 gap-4">
            <StudyTrendChart data={studyData} />
            <StudyHeatmap data={studyData} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SubjectDistribution data={studyData} />
            <FocusAnalysis data={studyData} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <GoalProgress data={studyData} />
            <DualGrowth data={studyData} />
          </div>
          <TodayTimeline data={studyData} onDelete={deleteSession} />
        </>
      )}

      <div className="pt-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">生活与健康</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TodayTasks tasks={tasks} onToggle={toggleTask} />
        <WeeklyTrend data={dashData} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DietSummary data={dashData} />
        <ExerciseSummary data={dashData} />
      </div>
      <div className="max-w-md mx-auto">
        <MoodCard />
      </div>
    </div>
  )
}
