import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, LiveActivity } from '../types'

interface AuthContextType {
  user: User | null
  partner: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: { nickname: string; avatar_url: string | null }) => Promise<void>
  liveActivity: LiveActivity | null
  partnerActivity: LiveActivity | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [partner, setPartner] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveActivity, setLiveActivity] = useState<LiveActivity | null>(null)
  const [partnerActivity, setPartnerActivity] = useState<LiveActivity | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id)
      } else {
        setUser(null)
        setPartner(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    void loadPartner()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    // Realtime is immediate when the connection is healthy. A small polling
    // fallback keeps both dashboards correct when a phone sleeps or briefly
    // misses a WebSocket event.
    const refreshActivities = () => {
      void loadMyActivity()
      if (partner) void loadPartnerActivity()
      else setPartnerActivity(null)
    }
    refreshActivities()

    const channel = supabase
      .channel(`realtime_changes_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_activities' }, () => {
        refreshActivities()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const updated = payload.new as User
        // If it's the partner's profile, update partner state
        if (partner && updated.id === partner.id) {
          setPartner(updated)
        }
        // If it's my own profile, update user state
        if (user && updated.id === user.id) {
          setUser(updated)
        }
      })
      .subscribe()
    const interval = window.setInterval(refreshActivities, 10_000)
    window.addEventListener('couple-study:activity-changed', refreshActivities)
    return () => {
      channel.unsubscribe()
      window.clearInterval(interval)
      window.removeEventListener('couple-study:activity-changed', refreshActivities)
    }
  }, [user?.id, partner?.id])

  async function loadUser(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setUser(data as User)
    setLoading(false)
  }

  async function loadPartner() {
    const { data } = await supabase.from('profiles').select('*').neq('id', user!.id)
    if (data?.[0]) setPartner(data[0] as User)
  }

  async function loadPartnerActivity() {
    if (!partner) return
    const { data } = await supabase
      .from('live_activities')
      .select('*')
      .eq('user_id', partner.id)
      .eq('is_active', true)
      .maybeSingle()
    setPartnerActivity(data as LiveActivity | null)
  }

  async function loadMyActivity() {
    if (!user) return
    const { data } = await supabase
      .from('live_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    setLiveActivity(data as LiveActivity | null)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    // Clean up live activity
    if (user) {
      await supabase.from('live_activities').delete().eq('user_id', user.id)
    }
    await supabase.auth.signOut()
    setUser(null)
    setPartner(null)
  }

  async function updateProfile(profile: { nickname: string; avatar_url: string | null }) {
    if (!user) throw new Error('请先登录')
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    if (data) setUser(data as User)
  }

  return (
    <AuthContext.Provider value={{ user, partner, loading, signIn, signOut, updateProfile, liveActivity, partnerActivity }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
