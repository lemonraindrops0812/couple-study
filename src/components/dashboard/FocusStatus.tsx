import { useAuth } from '../../hooks/useAuth'
import { Flame } from 'lucide-react'

export function FocusStatus() {
  const { user, partner, liveActivity, partnerActivity } = useAuth()

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Flame size={16} className="text-orange-500" />
        实时专注
      </h3>

      <div className="space-y-3">
        {/* Me */}
        <div className={`rounded-lg px-4 py-3 ${liveActivity ? 'bg-teal-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${liveActivity ? 'bg-teal-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs font-medium text-gray-500">{user?.nickname || '我'}</span>
          </div>
          {liveActivity ? (
            <p className="text-sm font-medium text-teal-700 mt-1">
              正在专注 · {liveActivity.subject}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">暂无学习</p>
          )}
        </div>

        {/* Partner */}
        <div className={`rounded-lg px-4 py-3 ${partnerActivity ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${partnerActivity ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs font-medium text-gray-500">{partner?.nickname || '对方'}</span>
          </div>
          {partnerActivity ? (
            <p className="text-sm font-medium text-blue-700 mt-1">
              正在专注 · {partnerActivity.subject}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">暂无学习</p>
          )}
        </div>
      </div>
    </div>
  )
}
