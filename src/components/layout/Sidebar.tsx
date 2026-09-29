import { useState, useRef } from 'react'
import {
  LayoutDashboard, BookOpen, ListTodo, Utensils, Dumbbell, BarChart3, X, Upload, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { SidebarItem } from './SidebarItem'
import { UserProfile } from './UserProfile'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/study', icon: BookOpen, label: '学习' },
  { to: '/tasks', icon: ListTodo, label: '计划' },
  { to: '/diet', icon: Utensils, label: '饮食' },
  { to: '/exercise', icon: Dumbbell, label: '运动' },
  { to: '/stats', icon: BarChart3, label: '统计' },
]

function Avatar({ nickname, avatarUrl, size }: { nickname: string; avatarUrl?: string; size: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-8 h-8 text-sm'
  if (avatarUrl) return <img src={avatarUrl} alt={nickname} className={`${cls} rounded-full object-cover`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
  return <div className={`${cls} rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold`}>{nickname?.[0] || '?'}</div>
}

interface Props {
  collapsed: boolean
  onToggle: () => void
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, onMobileClose }: Props) {
  const { user, signOut, updateProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const displayAvatar = previewUrl || avatarUrl || user?.avatar_url
  const width = collapsed ? 'w-[72px]' : 'w-56'

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件。')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('头像不能超过 5 MB。')
      return
    }
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const filePath = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, contentType: file.type })
    setUploading(false)
    if (error) { alert('上传失败: ' + error.message); setPreviewUrl(null); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    if (urlData?.publicUrl) setAvatarUrl(`${urlData.publicUrl}?v=${Date.now()}`)
  }

  const saveProfile = async () => {
    if (!user || !nickname.trim()) return
    setSaving(true)
    try {
      await updateProfile({ nickname: nickname.trim(), avatar_url: avatarUrl.trim() || null })
      setShowSettings(false)
    } catch (error) {
      alert(`保存失败：${error instanceof Error ? error.message : '请稍后再试'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen ${width} max-w-[85vw] bg-[#fffdf8] border-r border-amber-100/50 flex flex-col transition-all duration-300 z-40`}
      >
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden absolute top-3 right-3 p-1 text-stone-400 hover:text-stone-600"
        >
          <X size={20} />
        </button>

        {/* Toggle + Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4`}>
          {!collapsed && <h1 className="text-base font-bold text-emerald-700 tracking-tight">Couple Study</h1>}
          <button onClick={onToggle} className="text-stone-300 hover:text-stone-500 transition-colors p-1">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} space-y-0.5`}>
          {navItems.map(item => (
            <SidebarItem key={item.to} {...item} collapsed={collapsed} onClick={onMobileClose} />
          ))}
        </nav>

        {/* User footer */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-4 border-t border-amber-100/50`}>
          <UserProfile
            nickname={user?.nickname || '?'}
            email={user?.email || ''}
            avatarUrl={user?.avatar_url}
            collapsed={collapsed}
            onSettings={() => {
              setNickname(user?.nickname || '')
              setAvatarUrl(user?.avatar_url || '')
              setPreviewUrl(null)
              setShowSettings(true)
            }}
            onSignOut={signOut}
          />
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-700">个人设置</h3>
              <button onClick={() => setShowSettings(false)} className="text-stone-300 hover:text-stone-500"><X size={16} /></button>
            </div>
            <div className="flex items-center justify-center">
              <Avatar nickname={nickname || '?'} avatarUrl={displayAvatar} size="lg" />
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-stone-200 hover:border-emerald-300 rounded-lg text-xs text-stone-500 hover:text-emerald-600 transition-colors">
                <Upload size={14} />{uploading ? '上传中...' : previewUrl ? '重新选择图片' : '点击上传头像'}
              </button>
            </div>
            <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100" /></div><div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-stone-300">或粘贴链接</span></div></div>
            <input type="url" value={avatarUrl} onChange={e => { setAvatarUrl(e.target.value); setPreviewUrl(null) }}
              placeholder="https://example.com/avatar.jpg" className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">昵称</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveProfile()}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="输入昵称" />
            </div>
            <button onClick={saveProfile} disabled={saving || !nickname.trim()}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
