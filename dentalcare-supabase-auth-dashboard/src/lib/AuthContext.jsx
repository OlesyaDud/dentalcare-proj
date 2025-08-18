import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthCtx = createContext({ user: null, session: null, loading: true })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, session: null, loading: true })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setState({ user: session?.user ?? null, session, loading: false })
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
