import { useMemo, useState } from 'react'
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
import { Bell, CalendarDays, Sparkles, Pencil, X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { StudyOverviewCard } from './StudyOverviewCard'
import { StudyTrendChart } from './StudyTrendChart'
import { StudyHeatmap } from './StudyHeatmap'
import { SubjectDistribution } from './SubjectDistribution'
import { FocusAnalysis } from './FocusAnalysis'
import { GoalProgress } from './GoalProgress'
import { DualGrowth } from './DualGrowth'
import { TodayTimeline } from './TodayTimeline'
import { getToday, shiftDateKey } from '../../lib/date'
import { useSharedGreetings } from '../../hooks/useSharedGreetings'

const DEFAULT_GREETINGS = [
  '一个人脑不亚于一个宇宙 🌌',
  '流水不争先，争的是滔滔不绝 🌊',
  '何时葡萄先熟透，你需静候再静候 🍇',
  '一定要相信备考是一场平等的交易 ⚖️',
  '男孩女孩 四仰八叉手脚并用地向前蛄蛹吧 🐛',
  '你既想又何必怕，你既怕又何必想 💭',
]

const STORAGE_KEY = 'couple_greetings'
const VERSION_KEY = 'couple_greetings_v'

function loadGreetings(): string[] {
  try {
    const ver = localStorage.getItem(VERSION_KEY)
    const s = localStorage.getItem(STORAGE_KEY)
    // Auto-update to new defaults if version mismatch
    if (ver !== '2' || !s) {
      localStorage.setItem(VERSION_KEY, '2')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GREETINGS))
      return [...DEFAULT_GREETINGS]
    }
    const arr = JSON.parse(s); if (arr.length > 0) return arr
  } catch {}
  return [...DEFAULT_GREETINGS]
}

function formatDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
}

function formatShortDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function DashboardPage() {
  const { user, partner, liveActivity, partnerActivity } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => getToday())
  const todayKey = getToday()
  const viewingToday = selectedDate === todayKey
  const selectedDateLabel = formatShortDate(selectedDate)
  const { data: dashData } = useDashboard(selectedDate)
  const { data: studyData, loading: studyLoading, deleteSession, fetchAll: fetchStudyData } = useStudyAnalytics(selectedDate)
  const { tasks, toggleTask } = useTasks(selectedDate)

  const [legacyGreetings] = useState(loadGreetings)
  const { greetings, error: greetingsError, saveGreetings } = useSharedGreetings(legacyGreetings)
  const [editGreetings, setEditGreetings] = useState(false)
  const [newGreeting, setNewGreeting] = useState('')
  const greeting = useMemo(() => {
    const list = greetings.length > 0 ? greetings : DEFAULT_GREETINGS
    const key = `${todayKey}:${list.join('|')}`
    let hash = 0
    for (let index = 0; index < key.length; index++) hash = (hash * 31 + key.charCodeAt(index)) >>> 0
    return list[hash % list.length]
  }, [greetings, todayKey])

  const addGreeting = async () => {
    const g = newGreeting.trim()
    if (!g) return
    const next = [...greetings, g]
    if (await saveGreetings(next)) setNewGreeting('')
  }
  const removeGreeting = async (i: number) => {
    const next = greetings.filter((_, idx) => idx !== i)
    await saveGreetings(next)
  }
  const resetGreetings = async () => {
    await saveGreetings(DEFAULT_GREETINGS)
  }
  const handleDeleteSession = (id: string) => {
    if (window.confirm('确定删除这条学习记录吗？此操作无法撤销。')) void deleteSession(id)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Warm Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={22} className="text-amber-400" />
            {viewingToday ? '今日一起成长' : `${selectedDateLabel} 一起成长`}
          </h2>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} /> {formatDate(selectedDate)} ·
            <span className="text-amber-500">{greeting}</span>
            <button onClick={() => { setEditGreetings(!editGreetings); setNewGreeting('') }}
              className="text-stone-300 hover:text-amber-500 transition-colors ml-1">
              <Pencil size={12} />
            </button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex items-center rounded-xl border border-amber-100 bg-white p-1 shadow-sm">
            <button
              onClick={() => setSelectedDate(date => shiftDateKey(date, -1))}
              className="p-1.5 rounded-lg text-stone-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              title="查看前一天"
              aria-label="查看前一天"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              max={todayKey}
              onChange={event => {
                const value = event.target.value
                if (value && value <= todayKey) setSelectedDate(value)
              }}
              className="w-[132px] bg-transparent px-1 py-1 text-xs font-medium text-stone-600 outline-none"
              aria-label="选择要查看的日期"
            />
            <button
              onClick={() => setSelectedDate(date => shiftDateKey(date, 1))}
              disabled={viewingToday}
              className="p-1.5 rounded-lg text-stone-500 hover:bg-amber-50 hover:text-amber-700 transition-colors disabled:cursor-not-allowed disabled:text-stone-200 disabled:hover:bg-transparent"
              title="查看后一天"
              aria-label="查看后一天"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {!viewingToday && (
            <button
              onClick={() => setSelectedDate(todayKey)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <RotateCcw size={13} /> 回到今天
            </button>
          )}
          {viewingToday && <Countdown />}
          <button className="relative p-2 rounded-xl hover:bg-amber-50 transition-colors">
            <Bell size={18} className="text-amber-400" />
          </button>
        </div>
      </div>

      {/* ── Greeting Editor ── */}
      {editGreetings && (
        <div className="bg-white rounded-2xl border border-amber-100 p-4 space-y-3" style={{ background: 'linear-gradient(135deg, #fffdf7 0%, #fefce8 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-stone-600">编辑共同文案</h4>
              <p className="mt-0.5 text-[10px] text-stone-400">你们任一方修改，另一方会自动同步看到</p>
            </div>
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
          {greetingsError && <p className="text-[11px] text-rose-500">{greetingsError}</p>}
        </div>
      )}

      {!viewingToday && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-800">
          正在查看 {formatDate(selectedDate)} 的历史记录；进行中的学习状态与倒计时仅在“今天”显示，不会受到影响。
        </div>
      )}

      {/* ── 三人行 ── */}
      {viewingToday && <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user && <UserStatusCard userId={user.id} nickname={user.nickname} avatarUrl={user.avatar_url} isMe liveActivity={liveActivity} streakDays={studyData.streakDays} />}
          <div className="space-y-4">
            <CoupleZone data={studyData} />
            <GrowthTree data={studyData} />
          </div>
          {partner && <UserStatusCard userId={partner.id} nickname={partner.nickname} avatarUrl={partner.avatar_url} isMe={false} liveActivity={partnerActivity} streakDays={studyData.partnerStreakDays} />}
        </div>
        <FocusStatus />
      </>}

      {!studyLoading && (
        <>
          <StudyOverviewCard data={studyData} dayLabel={viewingToday ? '今日' : selectedDateLabel} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StudyTrendChart data={studyData} dayLabel={viewingToday ? '今天' : selectedDateLabel} />
            <StudyHeatmap data={studyData} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SubjectDistribution data={studyData} dayLabel={viewingToday ? '今日' : selectedDateLabel} />
            <FocusAnalysis data={studyData} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GoalProgress data={studyData} />
            <DualGrowth data={studyData} />
          </div>
          <TodayTimeline data={studyData} dateLabel={viewingToday ? '今日' : selectedDateLabel} onDelete={handleDeleteSession} onUpdated={fetchStudyData} />
        </>
      )}

      <div className="pt-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">生活与健康</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayTasks tasks={tasks} onToggle={toggleTask} dateLabel={selectedDateLabel} isCurrent={viewingToday} />
        <WeeklyTrend data={dashData} endDateLabel={selectedDateLabel} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DietSummary data={dashData} isCurrent={viewingToday} />
        <ExerciseSummary data={dashData} isCurrent={viewingToday} />
      </div>
      <div className="max-w-md mx-auto">
        <MoodCard selectedDate={selectedDate} dateLabel={viewingToday ? '今日' : selectedDateLabel} />
      </div>
    </div>
  )
}
