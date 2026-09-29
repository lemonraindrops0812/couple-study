import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getToday } from '../lib/date'
import type { Task } from '../types'

export function useTasks(selectedDate = getToday()) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const today = selectedDate

  const fetchTasks = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })
    if (data) setTasks(data as Task[])
    setLoading(false)
  }, [user, today])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const addTask = async (title: string, category?: string, estimated_minutes?: number) => {
    if (!user) return
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id,
      title,
      date: today,
      completed: false,
      category: category || '其他',
      estimated_minutes: estimated_minutes || null,
    }).select().single()
    if (data) setTasks(prev => [...prev, data as Task])
  }

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from('tasks').update({ completed }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, loading, addTask, toggleTask, deleteTask, fetchTasks }
}
