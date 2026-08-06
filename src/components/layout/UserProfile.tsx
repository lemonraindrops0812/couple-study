import { Settings } from 'lucide-react'

function AvatarImg({ nickname, url, size }: { nickname: string; url?: string; size: string }) {
  if (url) return <img src={url} alt={nickname} className={`${size} rounded-full object-cover ring-2 ring-amber-100`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
  return <div className={`${size} rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold ring-2 ring-amber-200`}>{nickname?.[0] || '?'}</div>
}

interface Props {
  nickname: string
  email: string
  avatarUrl?: string
  collapsed: boolean
  onSettings: () => void
  onSignOut: () => void
}

export function UserProfile({ nickname, email, avatarUrl, collapsed, onSettings, onSignOut }: Props) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button onClick={onSettings} title={nickname}>
          <AvatarImg nickname={nickname} url={avatarUrl} size="w-10 h-10 text-sm" />
        </button>
        <button onClick={onSignOut} className="text-stone-300 hover:text-red-400 transition-colors" title="退出登录">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onSettings} className="shrink-0">
          <AvatarImg nickname={nickname} url={avatarUrl} size="w-9 h-9 text-sm" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-700 truncate">{nickname}</p>
          <p className="text-[10px] text-stone-400 truncate">{email}</p>
        </div>
        <button onClick={onSettings} className="text-stone-300 hover:text-stone-500 transition-colors">
          <Settings size={14} />
        </button>
      </div>
      <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-2 w-full text-xs text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        退出登录
      </button>
    </div>
  )
}
