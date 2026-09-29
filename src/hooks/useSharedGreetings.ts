import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const SHARED_GREETING_DATE = '2099-12-31'
const SHARED_GREETING_KIND = 'couple_shared_greetings_v1'
const MIGRATION_KEY = 'couple_shared_greetings_migrated_v1'

interface StoredGreetings {
  kind: typeof SHARED_GREETING_KIND
  greetings: string[]
  updatedAt: string
}

interface SharedGreetingRow {
  user_id: string
  note: string | null
  created_at: string
}

function normalizeGreetings(values: string[]) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))].slice(0, 100)
}

function sameGreetings(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function readStoredGreetings(note: string | null): StoredGreetings | null {
  if (!note) return null
  try {
    const value = JSON.parse(note) as StoredGreetings
    if (value.kind !== SHARED_GREETING_KIND || !Array.isArray(value.greetings)) return null
    return {
      kind: SHARED_GREETING_KIND,
      greetings: normalizeGreetings(value.greetings),
      updatedAt: value.updatedAt || '',
    }
  } catch {
    return null
  }
}

function hasMigrated() {
  try { return localStorage.getItem(MIGRATION_KEY) === 'true' } catch { return true }
}

function markMigrated() {
  try { localStorage.setItem(MIGRATION_KEY, 'true') } catch {}
}

/** A shared, realtime-synced greeting list for both accounts in the couple. */
export function useSharedGreetings(legacyGreetings: string[]) {
  const { user } = useAuth()
  const [greetings, setGreetings] = useState(() => normalizeGreetings(legacyGreetings))
  const [error, setError] = useState('')
  const hasLoaded = useRef(false)

  const writeGreetings = useCallback(async (values: string[]) => {
    if (!user) return false
    const next = normalizeGreetings(values)
    const { error: writeError } = await supabase.from('mood_entries').upsert({
      user_id: user.id,
      date: SHARED_GREETING_DATE,
      mood: 1,
      note: JSON.stringify({
        kind: SHARED_GREETING_KIND,
        greetings: next,
        updatedAt: new Date().toISOString(),
      } satisfies StoredGreetings),
    }, { onConflict: 'user_id,date' })

    if (writeError) {
      setError('文案同步失败，请稍后再试。')
      return false
    }
    setError('')
    setGreetings(next)
    markMigrated()
    return true
  }, [user])

  const fetchGreetings = useCallback(async () => {
    if (!user) return
    const { data, error: readError } = await supabase
      .from('mood_entries')
      .select('user_id,note,created_at')
      .eq('date', SHARED_GREETING_DATE)

    if (readError) {
      setError('文案暂时无法同步。')
      return
    }

    const latest = ((data || []) as SharedGreetingRow[])
      .map(row => ({ row, value: readStoredGreetings(row.note) }))
      .filter((entry): entry is { row: SharedGreetingRow; value: StoredGreetings } => entry.value !== null)
      .sort((a, b) => {
        const aTime = Date.parse(a.value.updatedAt) || Date.parse(a.row.created_at)
        const bTime = Date.parse(b.value.updatedAt) || Date.parse(b.row.created_at)
        return bTime - aTime
      })[0]

    if (!latest) {
      const saved = await writeGreetings(legacyGreetings)
      if (saved) hasLoaded.current = true
      return
    }

    const remoteGreetings = latest.value.greetings
    // Each browser imports its old local list once, so pre-existing custom
    // lines from either person are preserved during the move to shared storage.
    if (!hasMigrated()) {
      const mergedGreetings = normalizeGreetings([...remoteGreetings, ...legacyGreetings])
      if (!sameGreetings(remoteGreetings, mergedGreetings)) {
        const saved = await writeGreetings(mergedGreetings)
        if (!saved) return
      } else {
        markMigrated()
        setGreetings(remoteGreetings)
      }
    } else {
      setGreetings(remoteGreetings)
    }

    setError('')
    hasLoaded.current = true
  }, [legacyGreetings, user, writeGreetings])

  useEffect(() => {
    hasLoaded.current = false
    void fetchGreetings()
  }, [fetchGreetings])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`shared_greetings_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_entries' }, (payload) => {
        const record = payload.new as { date?: string } | undefined
        if (record?.date === SHARED_GREETING_DATE) void fetchGreetings()
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [fetchGreetings, user?.id])

  return { greetings, error, saveGreetings: writeGreetings, hasLoaded: hasLoaded.current }
}
