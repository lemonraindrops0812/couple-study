import { useAuth } from '../../hooks/useAuth'

export function FocusStatus() {
  const { user, partner, liveActivity, partnerActivity } = useAuth()

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-4" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}>
      <div className="grid grid-cols-2 gap-3">
        <FocusItem
          name={user?.nickname || '我'}
          activity={liveActivity}
          idleEmoji="☁️"
          idleText="准备开始今天的专注"
        />
        <FocusItem
          name={partner?.nickname || '对方'}
          activity={partnerActivity}
          idleEmoji="🌙"
          idleText="正在等待下一次专注"
        />
      </div>
    </div>
  )
}

function FocusItem({ name, activity, idleEmoji, idleText }: {
  name: string; activity: { subject: string; start_time: string } | null
  idleEmoji: string; idleText: string
}) {
  if (activity) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl">📖</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-emerald-700">{name} 正在专心学习</p>
          <p className="text-[11px] text-emerald-600 truncate">{activity.subject}</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-soft shrink-0" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{idleEmoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{name}</p>
        <p className="text-[11px] text-gray-400">{idleText}</p>
      </div>
    </div>
  )
}
