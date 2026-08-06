import { useState } from 'react'
import { useStudyTimer } from '../../hooks/useStudyTimer'
import { Play, Square, BookOpen, ArrowLeft } from 'lucide-react'

type MainSubject = '专业课' | '英语' | '政治' | '其他'
type Step = 'main' | 'sub' | 'other' | 'english'

const mainSubjects: { id: MainSubject; label: string; color: string }[] = [
  { id: '专业课', label: '专业课', color: 'bg-blue-500' },
  { id: '英语', label: '英语', color: 'bg-emerald-500' },
  { id: '政治', label: '政治', color: 'bg-orange-500' },
  { id: '其他', label: '其他', color: 'bg-purple-500' },
]

const subSubjects: Record<string, string[]> = {
  '专业课': ['口腔解剖生理学', '牙体牙髓病学', '牙周病学', '口腔颌面外科学', '口腔修复学', '口腔正畸学'],
  '政治': ['马原', '史纲', '思法', '毛概', '新思想'],
}

const englishOptions = ['刷真题', '背单词', '外刊阅读', '写作练习', '听网课', '其他']

export function StudyPage() {
  const { isStudying, subject, startTime, formatElapsed, startStudy, stopStudy } = useStudyTimer()
  const [step, setStep] = useState<Step>('main')
  const [mainSubject, setMainSubject] = useState<MainSubject>('专业课')
  const [selectedBook, setSelectedBook] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [selectedEng, setSelectedEng] = useState('')
  const [examYear, setExamYear] = useState('')

  const handleStart = (label: string) => {
    startStudy(label)
    setStep('main')
    setSelectedBook('')
    setCustomSubject('')
    setSelectedEng('')
    setExamYear('')
  }

  const handleSelectMain = (id: MainSubject) => {
    setMainSubject(id)
    if (id === '英语') {
      setStep('english')
      setSelectedEng('背单词')
      setExamYear('')
      setCustomSubject('')
    } else if (id === '其他') {
      setStep('other')
      setCustomSubject('')
    } else {
      setStep('sub')
      setSelectedBook(subSubjects[id][0])
    }
  }

  const handleEngStart = () => {
    if (selectedEng === '刷真题') {
      const yr = examYear.trim()
      handleStart(yr ? `英语刷真题·${yr}` : '英语刷真题')
    } else if (selectedEng === '其他') {
      if (customSubject.trim()) handleStart(`英语·${customSubject.trim()}`)
    } else {
      handleStart(`英语·${selectedEng}`)
    }
  }

  const handleStop = async () => {
    await stopStudy()
  }

  const handleBack = () => {
    setStep('main')
  }

  const engCanStart = () => {
    if (!selectedEng) return false
    if (selectedEng === '其他') return customSubject.trim() !== ''
    return true
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">学习计时</h2>

      {!isStudying ? (
        <>
          {/* == Main Step == */}
          {step === 'main' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-700">选择科目</h3>
              <div className="grid grid-cols-2 gap-3">
                {mainSubjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectMain(s.id)}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:border-teal-300 hover:bg-teal-50"
                  >
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* == 专业课 / 政治 sub step == */}
          {step === 'sub' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft size={14} /> 返回
              </button>
              <h3 className="text-sm font-semibold text-gray-700">选择{mainSubject}教材</h3>
              <div className="grid grid-cols-2 gap-3">
                {subSubjects[mainSubject].map(book => (
                  <button
                    key={book}
                    onClick={() => setSelectedBook(book)}
                    className={`p-3 rounded-xl border-2 text-sm transition-all ${
                      selectedBook === book
                        ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                        : 'border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    {book}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleStart(selectedBook)}
                disabled={!selectedBook}
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
              >
                <Play size={18} /> 开始学习
              </button>
            </div>
          )}

          {/* == 英语 sub step == */}
          {step === 'english' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft size={14} /> 返回
              </button>
              <h3 className="text-sm font-semibold text-gray-700">英语学习内容</h3>
              <div className="grid grid-cols-2 gap-3">
                {englishOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSelectedEng(opt); if (opt !== '其他') setCustomSubject('') }}
                    className={`p-3 rounded-xl border-2 text-sm transition-all ${
                      selectedEng === opt
                        ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                        : 'border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* 刷真题 → 年份输入 */}
              {selectedEng === '刷真题' && (
                <input
                  type="text"
                  value={examYear}
                  onChange={e => setExamYear(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEngStart()}
                  placeholder="输入年份，如 2024"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                />
              )}

              {/* 其他 → 自定义输入 */}
              {selectedEng === '其他' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && engCanStart() && handleEngStart()}
                  placeholder="例如：语法练习、翻译..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                />
              )}

              <button
                onClick={handleEngStart}
                disabled={!engCanStart()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
              >
                <Play size={18} /> 开始学习
              </button>
            </div>
          )}

          {/* == 其他自定义输入 == */}
          {step === 'other' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft size={14} /> 返回
              </button>
              <h3 className="text-sm font-semibold text-gray-700">输入学习内容</h3>
              <input
                type="text"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && customSubject.trim() && handleStart(customSubject.trim())}
                placeholder="例如：背单词、看论文..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={() => customSubject.trim() && handleStart(customSubject.trim())}
                disabled={!customSubject.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
              >
                <Play size={18} /> 开始学习
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 text-sm font-medium">
            <BookOpen size={14} />
            {subject}
          </div>
          <div>
            <p className="text-5xl font-mono font-bold text-gray-900 tracking-tight">
              {formatElapsed()}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              开始于 {startTime?.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={handleStop}
            className="inline-flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
          >
            <Square size={16} /> 结束学习
          </button>
        </div>
      )}
    </div>
  )
}
