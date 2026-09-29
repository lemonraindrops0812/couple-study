import { useAuth } from '../../hooks/useAuth'

export type AnalyticsPerson = 'me' | 'partner'

interface Props {
  value: AnalyticsPerson
  onChange: (value: AnalyticsPerson) => void
}

export function AnalyticsPersonToggle({ value, onChange }: Props) {
  const { user, partner } = useAuth()

  return (
    <div className="flex bg-stone-100 rounded-lg p-0.5 shrink-0">
      <button
        onClick={() => onChange('me')}
        className={`max-w-20 truncate px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
          value === 'me' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        {user?.nickname || '我'}
      </button>
      <button
        onClick={() => onChange('partner')}
        disabled={!partner}
        className={`max-w-20 truncate px-2.5 py-1 rounded-md text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:text-stone-300 ${
          value === 'partner' ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        {partner?.nickname || '对方'}
      </button>
    </div>
  )
}
