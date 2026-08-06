import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { DietRecord } from '../types'

export function useDiet() {
  const { user } = useAuth()
  const [records, setRecords] = useState<DietRecord[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  const fetchRecords = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('diet_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })
    if (data) setRecords(data as DietRecord[])
    setLoading(false)
  }, [user, today])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const addRecord = async (record: Omit<DietRecord, 'id' | 'user_id' | 'date' | 'created_at'>) => {
    if (!user) return
    const { data } = await supabase.from('diet_records').insert({
      user_id: user.id,
      date: today,
      ...record,
    }).select().single()
    if (data) setRecords(prev => [...prev, data as DietRecord])
  }

  const deleteRecord = async (id: string) => {
    await supabase.from('diet_records').delete().eq('id', id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return { records, loading, addRecord, deleteRecord, fetchRecords }
}
