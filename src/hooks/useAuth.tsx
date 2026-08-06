import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, LiveActivity } from '../types'

interface AuthContextType {
  user: User | null
  partner: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
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
    // Load partner
    loadPartner()
    // Subscribe to live activities + profiles
    const channel = supabase
      .channel('realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_activities' }, () => {
        loadPartnerActivity()
        loadMyActivity()
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
    return () => { channel.unsubscribe() }
  }, [user])

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

  return (
    <AuthContext.Provider value={{ user, partner, loading, signIn, signOut, liveActivity, partnerActivity }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
