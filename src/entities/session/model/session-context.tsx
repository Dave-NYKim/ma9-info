import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@shared/api/supabase'

export type Role = 'editor' | 'viewer'

export interface SessionState {
  userId: string | null
  email: string | null
  role: Role | null
  loading: boolean
}

const initial: SessionState = { userId: null, email: null, role: null, loading: true }
const SessionContext = createContext<SessionState>(initial)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initial)

  useEffect(() => {
    let alive = true
    const load = async (session: Session | null) => {
      const user = session?.user ?? null
      if (!user) {
        if (alive) setState({ userId: null, email: null, role: null, loading: false })
        return
      }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (alive)
        setState({
          userId: user.id,
          email: user.email ?? null,
          role: (data?.role as Role) ?? 'viewer',
          loading: false,
        })
    }
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => load(session))
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)
export const useIsEditor = () => useContext(SessionContext).role === 'editor'
