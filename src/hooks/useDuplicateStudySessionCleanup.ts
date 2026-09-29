import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { StudySession } from '../types'

type SessionForCleanup = Pick<StudySession, 'id' | 'date' | 'subject' | 'start_time' | 'end_time' | 'duration_minutes' | 'created_at'>

function endMinute(endTime: string) {
  return new Date(endTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Removes only unmistakable duplicate saves from an earlier timer bug. Rows
 * must share the same user, date, subject, exact timer start, duration and
 * finish minute; a real new study session cannot have that same timer start.
 * The earliest saved row is retained. Live activities are never queried here.
 */
export function useDuplicateStudySessionCleanup() {
  const { user } = useAuth()
  const hasRun = useRef(false)

  useEffect(() => {
    if (!user || hasRun.current) return
    hasRun.current = true

    const cleanUp = async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('id,date,subject,start_time,end_time,duration_minutes,created_at')
        .eq('user_id', user.id)
        .not('end_time', 'is', null)
        .order('created_at', { ascending: true })

      if (error || !data) return

      const grouped = new Map<string, SessionForCleanup[]>()
      for (const session of data as SessionForCleanup[]) {
        if (!session.end_time || !session.duration_minutes) continue
        const key = [
          session.date,
          session.subject,
          session.start_time,
          session.duration_minutes,
          endMinute(session.end_time),
        ].join('|')
        const group = grouped.get(key) || []
        group.push(session)
        grouped.set(key, group)
      }

      const duplicateIds = [...grouped.values()]
        .flatMap(group => group.length > 1 ? group.slice(1).map(session => session.id) : [])
      if (!duplicateIds.length) return

      await supabase.from('study_sessions').delete().in('id', duplicateIds)
    }

    void cleanUp()
  }, [user?.id])
}
