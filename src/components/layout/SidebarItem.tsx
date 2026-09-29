import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface Props {
  to: string
  icon: LucideIcon
  label: string
  collapsed: boolean
  onClick?: () => void
}

export function SidebarItem({ to, icon: Icon, label, collapsed, onClick }: Props) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-700 shadow-sm'
            : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
        }`}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}
