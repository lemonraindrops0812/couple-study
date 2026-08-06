import { useState, useMemo, useRef, useCallback } from 'react'
import { useDiet } from '../../hooks/useDiet'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Coffee, Sun, Moon, Cookie, Search, X } from 'lucide-react'
import type { DietRecord } from '../../types'

const mealTypes = [
  { id: 'breakfast' as const, label: '早餐', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: 'lunch' as const, label: '午餐', icon: Sun, color: 'bg-orange-100 text-orange-700' },
  { id: 'dinner' as const, label: '晚餐', icon: Moon, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'snack' as const, label: '加餐', icon: Cookie, color: 'bg-pink-100 text-pink-700' },
] as const

const DEFAULT_QUICK: Record<string, string[]> = {
  breakfast: ['鸡蛋×2', '全麦面包', '牛奶250ml', '燕麦粥', '豆浆', '包子×2', '玉米', '酸奶'],
  lunch: ['米饭150g', '鸡胸肉100g', '西兰花', '番茄炒蛋', '牛肉面', '饺子×12', '三文鱼', '糙米饭'],
  dinner: ['蔬菜沙拉', '豆腐汤', '红薯', '煎鱼', '虾仁', '紫菜蛋花汤', '杂粮粥', '蒸南瓜'],
  snack: ['苹果', '香蕉', '坚果30g', '蛋白粉', '酸奶', '全麦饼干', '黑巧克力', '橙子'],
}

const MACRO_COLORS = { protein: '#ef4444', carbs: '#f59e0b', fat: '#3b82f6' }

const GOALS_KEY = 'diet_goals'
const DEFAULT_GOALS = { calories: 1800, protein: 60, carbs: 180, fat: 50 }

function loadGoals() {
  try {
    const saved = localStorage.getItem(GOALS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { ...DEFAULT_GOALS }
}

function saveGoals(g: typeof DEFAULT_GOALS) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(g))
}

const QF_KEY = 'diet_quick_foods'

function loadQuickFoods(): Record<string, string[]> {
  try {
    const saved = localStorage.getItem(QF_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { ...DEFAULT_QUICK }
}

function saveQuickFoods(data: Record<string, string[]>) {
  localStorage.setItem(QF_KEY, JSON.stringify(data))
}

// Chinese food database (per 100g unless noted)
const CN_FOODS: Record<string, FoodResult> = {
  '鸡蛋': { name: '鸡蛋(1个约50g)', calories: 72, protein: 6.5, carbs: 0.5, fat: 5 },
  '番茄炒蛋': { name: '番茄炒蛋', calories: 85, protein: 5, carbs: 4, fat: 6 },
  '米饭': { name: '米饭', calories: 116, protein: 2.6, carbs: 25.6, fat: 0.3 },
  '饺子': { name: '饺子(10个)', calories: 250, protein: 10, carbs: 30, fat: 12 },
  '面条': { name: '面条(煮)', calories: 110, protein: 3.5, carbs: 22, fat: 0.5 },
  '馒头': { name: '馒头', calories: 223, protein: 7, carbs: 44, fat: 1 },
  '豆浆': { name: '豆浆', calories: 30, protein: 2.5, carbs: 1, fat: 1 },
  '牛奶': { name: '牛奶', calories: 54, protein: 3, carbs: 5, fat: 3 },
  '面包': { name: '面包', calories: 250, protein: 8, carbs: 48, fat: 3 },
  '包子': { name: '包子(肉)', calories: 230, protein: 8, carbs: 30, fat: 10 },
  '鸡胸肉': { name: '鸡胸肉', calories: 133, protein: 31, carbs: 0, fat: 1.5 },
  '西兰花': { name: '西兰花', calories: 34, protein: 3, carbs: 4, fat: 0.5 },
  '三文鱼': { name: '三文鱼', calories: 208, protein: 20, carbs: 0, fat: 13 },
  '牛肉': { name: '牛肉(瘦)', calories: 125, protein: 22, carbs: 0, fat: 4 },
  '豆腐': { name: '豆腐', calories: 76, protein: 8, carbs: 2, fat: 4.5 },
  '苹果': { name: '苹果', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  '香蕉': { name: '香蕉', calories: 93, protein: 1.2, carbs: 23, fat: 0.3 },
  '橙子': { name: '橙子', calories: 47, protein: 1, carbs: 11, fat: 0.1 },
  '坚果': { name: '坚果(混合)', calories: 607, protein: 20, carbs: 16, fat: 54 },
  '酸奶': { name: '酸奶', calories: 72, protein: 3, carbs: 10, fat: 2.5 },
  '鸡肉': { name: '鸡肉', calories: 167, protein: 25, carbs: 0, fat: 7 },
  '红薯': { name: '红薯', calories: 86, protein: 1.5, carbs: 20, fat: 0.1 },
  '玉米': { name: '玉米', calories: 112, protein: 4, carbs: 22, fat: 1.5 },
  '虾仁': { name: '虾仁', calories: 48, protein: 11, carbs: 0, fat: 0.2 },
  '燕麦': { name: '燕麦', calories: 377, protein: 14, carbs: 66, fat: 7 },
  '黑巧克力': { name: '黑巧克力', calories: 550, protein: 5, carbs: 50, fat: 35 },
  '蛋白粉': { name: '蛋白粉(1勺30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  '猪肉': { name: '猪肉(瘦)', calories: 143, protein: 20, carbs: 0, fat: 6 },
  '土豆': { name: '土豆', calories: 76, protein: 2, carbs: 17, fat: 0.1 },
  '胡萝卜': { name: '胡萝卜', calories: 37, protein: 1, carbs: 9, fat: 0.2 },
  '菠菜': { name: '菠菜', calories: 23, protein: 3, carbs: 3, fat: 0.3 },
  '西红柿': { name: '西红柿', calories: 18, protein: 1, carbs: 4, fat: 0.2 },
  '黄瓜': { name: '黄瓜', calories: 15, protein: 0.7, carbs: 3, fat: 0.1 },
  '排骨': { name: '排骨', calories: 264, protein: 18, carbs: 0, fat: 21 },
  '炒青菜': { name: '炒青菜', calories: 45, protein: 2, carbs: 3, fat: 3 },
  '粥': { name: '粥(白米)', calories: 46, protein: 1, carbs: 10, fat: 0.1 },
  '紫菜': { name: '紫菜', calories: 250, protein: 30, carbs: 20, fat: 2 },
  '南瓜': { name: '南瓜', calories: 22, protein: 0.7, carbs: 5, fat: 0.1 },
  '冬瓜': { name: '冬瓜', calories: 11, protein: 0.4, carbs: 2.5, fat: 0.2 },
  '洋葱': { name: '洋葱', calories: 39, protein: 1, carbs: 9, fat: 0.1 },
  '青椒': { name: '青椒', calories: 22, protein: 1, carbs: 4, fat: 0.2 },
  '香菇': { name: '香菇', calories: 26, protein: 2, carbs: 5, fat: 0.3 },
  '木耳': { name: '木耳(干)', calories: 265, protein: 10, carbs: 36, fat: 1.5 },
  '莲藕': { name: '莲藕', calories: 73, protein: 2, carbs: 16, fat: 0.1 },
  '毛豆': { name: '毛豆', calories: 131, protein: 13, carbs: 10, fat: 5 },
  '花生': { name: '花生', calories: 563, protein: 25, carbs: 16, fat: 45 },
  '瓜子': { name: '瓜子', calories: 597, protein: 23, carbs: 10, fat: 50 },
  '蛋糕': { name: '蛋糕', calories: 347, protein: 5, carbs: 55, fat: 12 },
  '饼干': { name: '饼干', calories: 433, protein: 6, carbs: 70, fat: 14 },
  '雪糕': { name: '雪糕', calories: 175, protein: 3, carbs: 22, fat: 8 },
}

function searchLocalFood(query: string): FoodResult[] {
  const q = query.toLowerCase()
  return Object.values(CN_FOODS).filter(f => f.name.includes(q))
}

interface FoodResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function DietPage() {
  const { records, loading, addRecord, deleteRecord } = useDiet()
  const [mealType, setMealType] = useState<typeof mealTypes[number]['id']>('breakfast')
  const [foodName, setFoodName] = useState('')
  const [weight, setWeight] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [showQuick, setShowQuick] = useState(false)
  const [quickFoods, setQuickFoods] = useState(loadQuickFoods)
  const [editingQuick, setEditingQuick] = useState(false)
  const [newQuickFood, setNewQuickFood] = useState('')
  const [goals, setGoals] = useState(loadGoals)
  const [editingGoals, setEditingGoals] = useState(false)

  // Food search
  const [searchResults, setSearchResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)

    // First try local Chinese DB (instant)
    const localResults = searchLocalFood(query)
    if (localResults.length > 0) {
      setSearchResults(localResults)
      setSearching(false)
      return
    }

    // Fallback to Open Food Facts
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=5&fields=product_name,nutriments`)
      const json = await res.json()
      const results: FoodResult[] = (json.products || []).map((p: any) => ({
        name: p.product_name || query,
        calories: Math.round((p.nutriments?.['energy-kcal_100g'] || 0) * 100) / 100,
        protein: Math.round((p.nutriments?.proteins_100g || 0) * 100) / 100,
        carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 100) / 100,
        fat: Math.round((p.nutriments?.fat_100g || 0) * 100) / 100,
      })).filter((r: FoodResult) => r.calories > 0)
      setSearchResults(results.length > 0 ? results : [])
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }, [])

  const onFoodChange = (val: string) => {
    setFoodName(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (val.length >= 2) {
      searchTimer.current = setTimeout(() => doSearch(val), 400)
    } else {
      setSearchResults([])
    }
  }

  const selectFood = (result: FoodResult) => {
    setFoodName(result.name)
    // Scale to weight if entered, otherwise show per 100g values
    const w = weight ? Number(weight) : 100
    const scale = w / 100
    setCalories(String(Math.round(result.calories * scale)))
    setProtein(String(Math.round(result.protein * scale * 10) / 10))
    setCarbs(String(Math.round(result.carbs * scale * 10) / 10))
    setFat(String(Math.round(result.fat * scale * 10) / 10))
    setSearchResults([])
  }

  const recalcWithWeight = (w: string) => {
    setWeight(w)
    const val = Number(w)
    if (!val || val <= 0) return
    // If we have nutrition data already, recalculate based on new weight
    if (calories || protein || carbs || fat) {
      const oldScale = 100 // per 100g was the original
      const newScale = val / 100
      if (oldScale) {
        setCalories(prev => prev ? String(Math.round(Number(prev) * newScale)) : prev)
        setProtein(prev => prev ? String(Math.round(Number(prev) * newScale * 10) / 10) : prev)
        setCarbs(prev => prev ? String(Math.round(Number(prev) * newScale * 10) / 10) : prev)
        setFat(prev => prev ? String(Math.round(Number(prev) * newScale * 10) / 10) : prev)
      }
    }
  }

  const handleAdd = (name?: string) => {
    const food = (name || foodName).trim()
    if (!food) return
    addRecord({
      meal_type: mealType,
      food_name: food,
      weight_g: weight ? Number(weight) : null,
      calories: calories ? Number(calories) : null,
      protein: protein ? Number(protein) : null,
      carbs: carbs ? Number(carbs) : null,
      fat: fat ? Number(fat) : null,
    } as any)
    setFoodName(''); setWeight(''); setCalories(''); setProtein(''); setCarbs(''); setFat('')
    setSearchResults([])
  }

  const quickAdd = (food: string) => {
    setFoodName(food)
    setShowQuick(false)
  }

  const addQuickFood = () => {
    const f = newQuickFood.trim()
    if (!f) return
    const updated = { ...quickFoods, [mealType]: [...(quickFoods[mealType] || []), f] }
    setQuickFoods(updated)
    saveQuickFoods(updated)
    setNewQuickFood('')
  }

  const removeQuickFood = (food: string) => {
    const updated = { ...quickFoods, [mealType]: quickFoods[mealType].filter(f => f !== food) }
    setQuickFoods(updated)
    saveQuickFoods(updated)
  }

  // Group records by meal type
  const grouped = useMemo(() => {
    const map: Record<string, DietRecord[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
    records.forEach(r => { if (map[r.meal_type]) map[r.meal_type].push(r) })
    return map
  }, [records])

  const totalCal = records.reduce((s, r) => s + (r.calories || 0), 0)
  const totalP = records.reduce((s, r) => s + (r.protein || 0), 0)
  const totalC = records.reduce((s, r) => s + (r.carbs || 0), 0)
  const totalF = records.reduce((s, r) => s + (r.fat || 0), 0)
  const macroData = [
    { name: '蛋白质', value: totalP, color: MACRO_COLORS.protein },
    { name: '碳水', value: totalC, color: MACRO_COLORS.carbs },
    { name: '脂肪', value: totalF, color: MACRO_COLORS.fat },
  ].filter(d => d.value > 0)

  const currentMT = mealTypes.find(m => m.id === mealType)!

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">饮食记录</h2>

      {/* === Top Summary === */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {/* Goals editable header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">今日摄入</h3>
          <button onClick={() => setEditingGoals(!editingGoals)} className="text-xs text-teal-600 hover:text-teal-700">
            {editingGoals ? '完成' : '目标'}
          </button>
        </div>

        {editingGoals && (
          <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            {[{ k: 'calories', label: '热量', unit: 'kcal' }, { k: 'protein', label: '蛋白', unit: 'g' }, { k: 'carbs', label: '碳水', unit: 'g' }, { k: 'fat', label: '脂肪', unit: 'g' }].map(g => (
              <div key={g.k}>
                <label className="text-[10px] text-gray-400">{g.label}</label>
                <input
                  type="number"
                  value={goals[g.k as keyof typeof goals]}
                  onChange={e => { const n = { ...goals, [g.k]: Number(e.target.value) }; setGoals(n); saveGoals(n) }}
                  className="w-full px-2 py-1 rounded border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[9px] text-gray-300">{g.unit}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6">
          {/* Calorie ring with goal */}
          <div className="text-center shrink-0 relative">
            <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={totalCal > goals.calories ? '#ef4444' : '#0d9488'} strokeWidth="6"
                strokeDasharray={`${Math.min(totalCal / goals.calories * 214, 214)} 214`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <p className={`text-sm font-bold ${totalCal > goals.calories ? 'text-red-500' : 'text-teal-600'}`}>{totalCal}</p>
                <p className="text-[9px] text-gray-400">{goals.calories}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            <MacroRow label="蛋白质" value={totalP} color="bg-red-400" goal={goals.protein} />
            <MacroRow label="碳水" value={totalC} color="bg-amber-400" goal={goals.carbs} />
            <MacroRow label="脂肪" value={totalF} color="bg-blue-400" goal={goals.fat} />
          </div>

          {macroData.length > 0 && (
            <div className="shrink-0">
              <ResponsiveContainer width={60} height={60}>
                <PieChart>
                  <Pie data={macroData} dataKey="value" cx="50%" cy="50%" innerRadius={16} outerRadius={28}>
                    {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* === Add Form === */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        {/* Meal type tabs */}
        <div className="flex gap-2">
          {mealTypes.map(mt => (
            <button
              key={mt.id}
              onClick={() => setMealType(mt.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                mealType === mt.id ? `${mt.color} shadow-sm` : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <mt.icon size={15} /> {mt.label}
            </button>
          ))}
        </div>

        {/* Quick add */}
        <button onClick={() => setShowQuick(!showQuick)} className="text-xs text-teal-600 hover:text-teal-700">
          {showQuick ? '收起快捷添加' : '⚡ 快捷添加'} · <button onClick={() => setEditingQuick(!editingQuick)} className="hover:underline">{editingQuick ? '完成编辑' : '自定义'}</button>
        </button>

        {showQuick && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {quickFoods[mealType]?.map(food => (
                <span key={food} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-teal-50 text-xs text-gray-600 hover:text-teal-700 transition-colors cursor-pointer group">
                  <span onClick={() => quickAdd(food)}>{food}</span>
                  {editingQuick && (
                    <button onClick={() => removeQuickFood(food)} className="text-gray-300 hover:text-red-400">
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editingQuick && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuickFood}
                  onChange={e => setNewQuickFood(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addQuickFood()}
                  placeholder="添加自定义食物..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button onClick={addQuickFood} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs">添加</button>
              </div>
            )}
          </div>
        )}

        {/* Food search input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-3 text-gray-300" />
              <input
                type="text"
                value={foodName}
                onChange={e => onFoodChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="输入食物名搜索，自动识别热量..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                value={weight}
                onChange={e => recalcWithWeight(e.target.value)}
                placeholder="100"
                className="w-24 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-gray-300">g</span>
            </div>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 left-0 right-24 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectFood(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center justify-between transition-colors border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-700 truncate flex-1">{r.name}</span>
                  <span className="text-xs text-teal-600 shrink-0 ml-2">{r.calories}kcal</span>
                </button>
              ))}
            </div>
          )}
          {searching && foodName.length >= 2 && (
            <div className="absolute z-10 left-0 right-24 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg p-3 text-center">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>

        {/* Macro inputs (auto-filled or manual) */}
        <div className="grid grid-cols-4 gap-2">
          <NutrientInput label="热量" value={calories} onChange={setCalories} unit="kcal" />
          <NutrientInput label="蛋白质" value={protein} onChange={setProtein} unit="g" />
          <NutrientInput label="碳水" value={carbs} onChange={setCarbs} unit="g" />
          <NutrientInput label="脂肪" value={fat} onChange={setFat} unit="g" />
        </div>

        <button
          onClick={() => handleAdd()}
          disabled={!foodName.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
        >
          <Plus size={16} /> 添加{currentMT.label}记录
        </button>
      </div>

      {/* === Records by meal === */}
      {loading ? (
        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Coffee size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">今天还没有饮食记录</p>
          <p className="text-xs text-gray-300 mt-1">添加你的第一餐吧 🍽️</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mealTypes.map(mt => {
            const items = grouped[mt.id]
            if (!items?.length) return null
            const mealCal = items.reduce((s, r) => s + (r.calories || 0), 0)
            return (
              <div key={mt.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/50 border-b border-gray-50">
                  <mt.icon size={15} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{mt.label}</span>
                  <span className="ml-auto text-xs text-gray-400">{mealCal} kcal</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(record => (
                    <div key={record.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{record.food_name}</p>
                        <p className="text-[10px] text-gray-400">
                          {[record.weight_g && `${record.weight_g}g`, record.calories && `${record.calories}kcal`,
                            record.protein && `蛋白${record.protein}g`, record.carbs && `碳水${record.carbs}g`,
                            record.fat && `脂肪${record.fat}g`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <button onClick={() => deleteRecord(record.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MacroRow({ label, value, color, goal }: { label: string; value: number; color: string; goal: number }) {
  const pct = Math.min(Math.round((value / goal) * 100), 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-8">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-16 text-right">{value}g / {goal}g</span>
    </div>
  )
}

function NutrientInput({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <div className="relative">
      <label className="block text-[10px] text-gray-400 mb-0.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        className="w-full pl-2 pr-8 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <span className="absolute right-2 bottom-2 text-[10px] text-gray-300">{unit}</span>
    </div>
  )
}
