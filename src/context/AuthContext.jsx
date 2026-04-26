import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  const loadProfile = useCallback(async (uid) => {
    if (!supabase || !uid) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (error) {
      console.warn('[auth] profile load', error.message)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (cancelled) return
        setSession(s)
        if (s?.user?.id) return loadProfile(s.user.id)
        setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user?.id) void loadProfile(s.user.id)
      else setProfile(null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWithEmail = useCallback(async (email, password) => {
    if (!supabase) return { error: new Error('Supabase is not configured') }
    return supabase.auth.signInWithPassword({ email: email.trim(), password })
  }, [])

  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    if (!supabase) return { error: new Error('Supabase is not configured') }
    return supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName?.trim() || '' } },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      supabaseConfigured: isSupabaseConfigured,
      supabase,
      session,
      user,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshProfile: () => (user?.id ? loadProfile(user.id) : Promise.resolve()),
    }),
    [session, user, profile, loading, signInWithEmail, signUpWithEmail, signOut, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
