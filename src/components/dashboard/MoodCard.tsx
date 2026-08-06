import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Smile, Frown, Meh, Heart } from 'lucide-react'

const moodOptions = [
  { value: 2 as const, icon: Frown, label: '不太好', color: 'text-gray-400' },
  { value: 3 as const, icon: Meh, label: '一般般', color: 'text-yellow-500' },
  { value: 4 as const, icon: Smile, label: '还不错', color: 'text-green-500' },
  { value: 5 as const, icon: Heart, label: '超棒', color: 'text-pink-500' },
]

export function MoodCard() {
  const { user, partner } = useAuth()
  const [mood, setMood] = useState<number | null>(null)
  const [partnerMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    // Load today's moods (mock - no table yet, so gracefully empty)
    // When mood table exists, uncomment below:
    // supabase.from('mood_entries').select('*').eq('date', today)
    //   .then(({ data }) => {
    //     const mine = (data as MoodEntry[])?.find(m => m.user_id === user.id)
    //     if (mine) { setMood(mine.mood); setNote(mine.note); setSaved(true) }
    //     if (partner) {
    //       const theirs = (data as MoodEntry[])?.find(m => m.user_id === partner.id)
    //       if (theirs) setPartnerMood(theirs.mood)
    //     }
    //   })
  }, [user, partner, today])

  const saveMood = async (value: number) => {
    setMood(value)
    setSaved(true)
    // When mood table exists: upsert to mood_entries
  }

  const MoodIcon = moodOptions.find(m => m.value === mood)?.icon

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">今日心情</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Me */}
        <div className="text-center">
          <p className="text-[10px] text-gray-400 mb-2">{user?.nickname || '我'}</p>
          {saved ? (
            MoodIcon && <MoodIcon size={28} className={`mx-auto mb-1 ${moodOptions.find(m => m.value === mood)?.color}`} />
          ) : (
            <div className="flex justify-center gap-1.5">
              {moodOptions.map(m => (
                <button key={m.value} onClick={() => saveMood(m.value)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                  <m.icon size={18} className="text-gray-300 hover:text-gray-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Partner */}
        <div className="text-center border-l border-gray-100">
          <p className="text-[10px] text-gray-400 mb-2">{partner?.nickname || '对方'}</p>
          {partnerMood ? (
            (() => {
              const pm = moodOptions.find(m => m.value === partnerMood)
              return pm ? <pm.icon size={28} className={`mx-auto mb-1 ${pm.color}`} /> : null
            })()
          ) : (
            <p className="text-xs text-gray-300">—</p>
          )}
        </div>
      </div>

      {saved && (
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="今天想说的一句话..."
          className="w-full px-3 py-2 rounded-lg border border-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-teal-300 bg-gray-50"
        />
      )}
    </div>
  )
}
