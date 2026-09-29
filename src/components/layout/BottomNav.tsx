import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ListTodo, Utensils, Dumbbell, BarChart3 } from 'lucide-react'

const tabs = [
  { to: '/', icon: LayoutDashboard, label: '概览' },
  { to: '/study', icon: BookOpen, label: '学习' },
  { to: '/tasks', icon: ListTodo, label: '任务' },
  { to: '/diet', icon: Utensils, label: '饮食' },
  { to: '/exercise', icon: Dumbbell, label: '运动' },
  { to: '/stats', icon: BarChart3, label: '统计' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-stone-100 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = location.pathname === tab.to
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 px-1 min-w-0 ${
                active ? 'text-emerald-600' : 'text-stone-400'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
