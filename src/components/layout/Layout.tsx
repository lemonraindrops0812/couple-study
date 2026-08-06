import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true' }
    catch { return false }
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }, [collapsed])

  const toggle = () => setCollapsed(prev => !prev)
  const sidebarW = collapsed ? 72 : 224 // 72px / 224px

  return (
    <div className="flex min-h-screen" style={{ background: '#faf9f6' }}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main
        className="flex-1 p-8 transition-all duration-300"
        style={{ marginLeft: `${sidebarW}px` }}
      >
        <Outlet />
      </main>
    </div>
  )
}
