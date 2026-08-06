import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getToday } from '../lib/date'
import type { MoodEntry } from '../types'

const today = getToday()

export function useMood() {
  const { user, partner } = useAuth()
  const [myMood, setMyMood] = useState<MoodEntry | null>(null)
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMoods = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('mood_entries').select('*').eq('date', today)
    if (data) {
      const entries = data as MoodEntry[]
      setMyMood(entries.find(e => e.user_id === user.id) || null)
      if (partner) setPartnerMood(entries.find(e => e.user_id === partner.id) || null)
    }
    setLoading(false)
  }, [user, partner, today])

  useEffect(() => { fetchMoods() }, [fetchMoods])

  const saveMood = async (mood: number, note?: string) => {
    if (!user) return
    await supabase.from('mood_entries').upsert({
      user_id: user.id,
      date: today,
      mood,
      note: note || null,
    }, { onConflict: 'user_id,date' })
    fetchMoods()
  }

  return { myMood, partnerMood, loading, saveMood }
}
