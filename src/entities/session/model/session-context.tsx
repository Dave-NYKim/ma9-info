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
    // onAuthStateChange 콜백은 auth 내부 락을 쥔 채 호출된다. 여기서 supabase 쿼리를
    // 곧바로 await 하면 그 쿼리가 다시 락을 요청 → 데드락 → loading 이 안 풀려 무한 로딩.
    // 프로필 조회를 콜백 밖(setTimeout 0)으로 미뤄 락을 먼저 반환한다. (Supabase 권장 패턴)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => load(session), 0)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)
export const useIsEditor = () => useContext(SessionContext).role === 'editor'
