import { useState } from 'react'
import { useDiet } from '../../hooks/useDiet'
import { Plus, Trash2, Coffee, Sun, Moon } from 'lucide-react'

const mealTypes = [
  { id: 'breakfast' as const, label: '早餐', icon: Coffee },
  { id: 'lunch' as const, label: '午餐', icon: Sun },
  { id: 'dinner' as const, label: '晚餐', icon: Moon },
]

export function DietPage() {
  const { records, loading, addRecord, deleteRecord } = useDiet()
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const handleAdd = () => {
    if (!foodName.trim()) return
    addRecord({
      meal_type: mealType,
      food_name: foodName.trim(),
      calories: calories ? Number(calories) : null,
      protein: protein ? Number(protein) : null,
      carbs: carbs ? Number(carbs) : null,
      fat: fat ? Number(fat) : null,
    } as any)
    setFoodName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
  }

  const totalCalories = records.reduce((sum, r) => sum + (r.calories || 0), 0)
  const totalProtein = records.reduce((sum, r) => sum + (r.protein || 0), 0)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">饮食记录</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{totalCalories}</p>
          <p className="text-xs text-gray-400">总热量 (kcal)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{totalProtein.toFixed(1)}</p>
          <p className="text-xs text-gray-400">蛋白质 (g)</p>
        </div>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          {mealTypes.map(mt => (
            <button
              key={mt.id}
              onClick={() => setMealType(mt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mealType === mt.id
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <mt.icon size={14} />
              {mt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            placeholder="食物名称..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="number"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            placeholder="热量"
            className="w-18 px-2 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="number"
            value={protein}
            onChange={e => setProtein(e.target.value)}
            placeholder="蛋白质"
            className="w-18 px-2 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={carbs}
            onChange={e => setCarbs(e.target.value)}
            placeholder="碳水g"
            className="w-18 px-2 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="number"
            value={fat}
            onChange={e => setFat(e.target.value)}
            placeholder="脂肪g"
            className="w-18 px-2 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-1.5">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">加载中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">今天还没有饮食记录 🍽️</p>
        ) : (
          records.map(record => {
            const mt = mealTypes.find(m => m.id === record.meal_type)
            const Icon = mt?.icon || Coffee
            return (
              <div key={record.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 group">
                <Icon size={16} className="text-gray-400" />
                <span className="flex-1 text-sm text-gray-700">{record.food_name}</span>
                {record.calories && (
                  <span className="text-xs text-gray-400">{record.calories} kcal</span>
                )}
                {record.protein && (
                  <span className="text-xs text-gray-400">{record.protein}g 蛋白质</span>
                )}
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
