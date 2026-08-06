import type { StudyAnalytics } from '../../hooks/useStudyAnalytics'
import { Heart, Users, Target } from 'lucide-react'
import { Countdown } from './Countdown'

interface Props { data: StudyAnalytics }

export function CoupleZone({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #fce7f3 100%)' }}>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-pink-700 mb-4 flex items-center gap-2">
          <Heart size={16} className="text-pink-400" /> 我们的今天
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <MiniPink icon={Users} label="共同学习" value={`${data.combinedSessionsWeek}次`} />
          <MiniPink icon={Heart} label="一起坚持" value={`${data.combinedDays}天`} />
          <MiniPink icon={Target} label="最长连续" value={`${data.bestTogetherStreak}天`} />
        </div>

        <Countdown />
      </div>
    </div>
  )
}

function MiniPink({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white/60 rounded-xl p-3 text-center">
      <Icon size={14} className="mx-auto mb-1 text-pink-400" />
      <p className="text-sm font-bold text-pink-700">{value}</p>
      <p className="text-[10px] text-pink-400">{label}</p>
    </div>
  )
}
