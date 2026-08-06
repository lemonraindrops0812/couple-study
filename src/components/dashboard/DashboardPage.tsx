import { useAuth } from '../../hooks/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { useTasks } from '../../hooks/useTasks'
import { UserStatusCard } from './UserStatusCard'
import { TodayTasks } from './TodayTasks'
import { StudyStatistics } from './StudyStatistics'
import { FocusStatus } from './FocusStatus'
import { DietSummary } from './DietSummary'
import { ExerciseSummary } from './ExerciseSummary'
import { MoodCard } from './MoodCard'
import { GrowthStats } from './GrowthStats'
import { WeeklyTrend } from './WeeklyTrend'
import { Bell, CalendarDays } from 'lucide-react'
import { Countdown } from './Countdown'

function formatDate() {
  const now = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
}

export function DashboardPage() {
  const { user, partner, liveActivity, partnerActivity } = useAuth()
  const { data, loading } = useDashboard()
  const { tasks, toggleTask } = useTasks()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">今日概览</h2>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            <CalendarDays size={14} />
            {formatDate()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Countdown */}
          <Countdown />
          {/* Notification */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={18} className="text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
          </button>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* ====== Column 1 ====== */}
        <div className="space-y-4">
          {user && (
            <UserStatusCard
              userId={user.id}
              nickname={user.nickname}
              avatarUrl={user.avatar_url}
              liveActivity={liveActivity}
            />
          )}
          {partner && (
            <UserStatusCard
              userId={partner.id}
              nickname={partner.nickname}
              avatarUrl={partner.avatar_url}
              liveActivity={partnerActivity}
            />
          )}
          <MoodCard />
        </div>

        {/* ====== Column 2 ====== */}
        <div className="space-y-4">
          <FocusStatus />
          <StudyStatistics data={data} loading={loading} />
          <GrowthStats data={data} />
        </div>

        {/* ====== Column 3 ====== */}
        <div className="space-y-4">
          <TodayTasks tasks={tasks} onToggle={toggleTask} />
          <DietSummary data={data} />
          <ExerciseSummary data={data} />
          <WeeklyTrend data={data} />
        </div>
      </div>
    </div>
  )
}
