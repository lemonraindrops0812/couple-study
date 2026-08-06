import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getToday } from '../lib/date'
import type { ExerciseRecord } from '../types'

export function useExercise() {
  const { user } = useAuth()
  const [records, setRecords] = useState<ExerciseRecord[]>([])
  const [loading, setLoading] = useState(true)

  const today = getToday()

  const fetchRecords = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('exercise_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })
    if (data) setRecords(data as ExerciseRecord[])
    setLoading(false)
  }, [user, today])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const addRecord = async (record: Omit<ExerciseRecord, 'id' | 'user_id' | 'date' | 'created_at'>) => {
    if (!user) return
    const { data } = await supabase.from('exercise_records').insert({
      user_id: user.id,
      date: today,
      ...record,
    }).select().single()
    if (data) setRecords(prev => [...prev, data as ExerciseRecord])
  }

  const deleteRecord = async (id: string) => {
    await supabase.from('exercise_records').delete().eq('id', id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return { records, loading, addRecord, deleteRecord, fetchRecords }
}
