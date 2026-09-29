import { useState, useEffect, type CSSProperties } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useDuplicateStudySessionCleanup } from '../../hooks/useDuplicateStudySessionCleanup'

export function Layout() {
  useDuplicateStudySessionCleanup()
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true' }
    catch { return false }
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }, [collapsed])

  const toggle = () => setCollapsed(prev => !prev)
  const sidebarW = collapsed ? 72 : 224
  const layoutStyle = { '--sidebar-width': `${sidebarW}px` } as CSSProperties

  return (
    <div className="flex min-h-screen" style={{ background: '#faf9f6', ...layoutStyle }}>
      {/* Desktop sidebar only */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>

      {/* Main content */}
      <main
        className="dashboard-main flex-1 p-4 md:p-8 pb-20 md:pb-8"
      >
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
