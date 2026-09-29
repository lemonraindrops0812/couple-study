import { useState, useEffect } from 'react'
import { useMood } from '../../hooks/useMood'
import { Smile, Frown, Meh, Heart } from 'lucide-react'

const moodOptions = [
  { value: 2 as const, icon: Frown, label: '不太好', color: 'text-gray-400' },
  { value: 3 as const, icon: Meh, label: '一般般', color: 'text-yellow-500' },
  { value: 4 as const, icon: Smile, label: '还不错', color: 'text-green-500' },
  { value: 5 as const, icon: Heart, label: '超棒', color: 'text-pink-500' },
]

interface Props {
  selectedDate?: string
  dateLabel?: string
}

export function MoodCard({ selectedDate, dateLabel = '今日' }: Props) {
  const { myMood, partnerMood, saveMood } = useMood(selectedDate)
  const [note, setNote] = useState(myMood?.note || '')
  const [editing, setEditing] = useState(false)

  useEffect(() => { setNote(myMood?.note || '') }, [myMood])

  const handleSave = (value: number) => {
    saveMood(value, note)
    setEditing(false)
  }

  const MyIcon = moodOptions.find(m => m.value === myMood?.mood)
  const PartnerIcon = moodOptions.find(m => m.value === partnerMood?.mood)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{dateLabel}心情</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* 我 */}
        <div className="text-center">
          <p className="text-[10px] text-gray-400 mb-2">我</p>
          {myMood ? (
            editing ? (
              <div className="space-y-1.5">
                <div className="flex justify-center gap-1.5">
                  {moodOptions.map(m => (
                    <button key={m.value} onClick={() => { handleSave(m.value); setEditing(false) }}
                      className={`p-1 rounded hover:bg-gray-100 transition-colors ${myMood.mood === m.value ? 'ring-2 ring-teal-300 rounded-full' : ''}`}>
                      <m.icon size={20} className={myMood.mood === m.value ? m.color : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
                <button onClick={() => setEditing(false)} className="text-[10px] text-gray-400 hover:text-gray-600">取消</button>
              </div>
            ) : (
              <div>
                {MyIcon && <MyIcon.icon size={28} className={`mx-auto mb-1 ${MyIcon.color}`} />}
                <p className="text-[10px] text-gray-400">{myMood.note || ''}</p>
                <button onClick={() => setEditing(true)} className="text-[10px] text-teal-600 hover:text-teal-700 mt-1">修改</button>
              </div>
            )
          ) : (
            <div className="flex justify-center gap-1.5">
              {moodOptions.map(m => (
                <button key={m.value} onClick={() => handleSave(m.value)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                  <m.icon size={20} className="text-gray-300 hover:text-gray-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 对方 */}
        <div className="text-center border-l border-gray-100">
          <p className="text-[10px] text-gray-400 mb-2">对方</p>
          {partnerMood ? (
            <div>
              {PartnerIcon && <PartnerIcon.icon size={28} className={`mx-auto mb-1 ${PartnerIcon.color}`} />}
              <p className="text-[10px] text-gray-400">{partnerMood.note || ''}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-300">—</p>
          )}
        </div>
      </div>

      {myMood && (
        <input
          type="text"
          value={note}
          onChange={e => { setNote(e.target.value); saveMood(myMood.mood, e.target.value) }}
          placeholder={`${dateLabel}想说的一句话...`}
          className="w-full px-3 py-2 rounded-lg border border-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-teal-300 bg-gray-50"
        />
      )}
    </div>
  )
}
