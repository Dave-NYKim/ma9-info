import { Navigate } from 'react-router-dom'
import { useSession } from '@entities/session'
import { LoginForm } from '@features/auth'

export function LoginPage() {
  const s = useSession()
  if (!s.loading && s.userId) return <Navigate to="/batters" replace />
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-[360px] rounded-2xl border border-line bg-surface shadow-[var(--shadow)] p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-extrabold text-lg">
          <span className="w-7 h-7 rounded-md grid place-items-center text-white" style={{ background: 'var(--clay)' }}>
            ⚾
          </span>
          MA9 선수 관리
        </div>
        <p className="text-ink-faint text-sm">Supabase 계정으로 로그인</p>
        <LoginForm />
      </div>
    </div>
  )
}
