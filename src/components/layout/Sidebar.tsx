import { useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ListTodo, Utensils, Dumbbell, BarChart3, LogOut, Settings, X, Upload
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

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
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={nickname}
        className={`${cls} rounded-full object-cover`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div className={`${cls} rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold`}>
      {nickname?.[0] || '?'}
    </div>
  )
}

export function Sidebar() {
  const { user, signOut } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const displayAvatar = previewUrl || avatarUrl || user?.avatar_url

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Preview
    setPreviewUrl(URL.createObjectURL(file))

    // Upload to Supabase Storage
    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    setUploading(false)

    if (error) {
      alert('上传失败: ' + error.message)
      setPreviewUrl(null)
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    if (urlData?.publicUrl) {
      setAvatarUrl(urlData.publicUrl)
    }
  }

  const saveProfile = async () => {
    if (!user || !nickname.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({
      nickname: nickname.trim(),
      avatar_url: avatarUrl.trim() || null,
    }).eq('id', user.id)
    window.location.reload()
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6">
          <h1 className="text-lg font-bold text-teal-600 tracking-tight">Couple Study</h1>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <Avatar nickname={user?.nickname || '?'} avatarUrl={user?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.nickname}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setNickname(user?.nickname || '')
                setAvatarUrl(user?.avatar_url || '')
                setPreviewUrl(null)
                setShowSettings(true)
              }}
              className="text-gray-300 hover:text-gray-500 transition-colors"
            >
              <Settings size={14} />
            </button>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">个人设置</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-300 hover:text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-center">
              <Avatar nickname={nickname || '?'} avatarUrl={displayAvatar} size="lg" />
            </div>

            {/* File upload */}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-lg text-xs text-gray-500 hover:text-teal-600 transition-colors"
              >
                <Upload size={14} />
                {uploading ? '上传中...' : previewUrl ? '重新选择图片' : '点击上传头像'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-gray-300">或粘贴链接</span></div>
            </div>

            {/* URL input */}
            <input
              type="url"
              value={avatarUrl}
              onChange={e => { setAvatarUrl(e.target.value); setPreviewUrl(null) }}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveProfile()}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="输入昵称"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={saving || !nickname.trim()}
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
