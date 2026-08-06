import { useNavigate } from 'react-router-dom'
import { Utensils, ArrowRight } from 'lucide-react'
import type { DashboardData } from '../../types'

interface Props {
  data: DashboardData
}

export function DietSummary({ data }: Props) {
  const navigate = useNavigate()
  const { dietCalories, dietProtein, dietCarbs, dietFat } = data
  const hasData = dietCalories > 0 || dietProtein > 0

  const macroTotal = (dietProtein || 0) + (dietCarbs || 0) + (dietFat || 0)
  const pPct = macroTotal ? Math.round((dietProtein / macroTotal) * 100) : 0
  const cPct = macroTotal ? Math.round((dietCarbs / macroTotal) * 100) : 0
  const fPct = macroTotal ? Math.round((dietFat / macroTotal) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">饮食记录</h3>
        <button onClick={() => navigate('/diet')} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 transition-colors">
          详细 <ArrowRight size={12} />
        </button>
      </div>

      {!hasData ? (
        <div className="text-center py-6">
          <Utensils size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-xs text-gray-400">今天还没有记录饮食</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{dietCalories}</span>
            <span className="text-xs text-gray-400">kcal</span>
          </div>
          {/* Macro bars */}
          <div className="space-y-1.5">
            <MacroBar label="蛋白质" value={dietProtein} pct={pPct} color="bg-red-400" unit="g" />
            <MacroBar label="碳水" value={dietCarbs} pct={cPct} color="bg-amber-400" unit="g" />
            <MacroBar label="脂肪" value={dietFat} pct={fPct} color="bg-blue-400" unit="g" />
          </div>
        </div>
      )}
    </div>
  )
}

function MacroBar({ label, value, pct, color, unit }: { label: string; value: number; pct: number; color: string; unit: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-8">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-12 text-right">{value}{unit}</span>
    </div>
  )
}
