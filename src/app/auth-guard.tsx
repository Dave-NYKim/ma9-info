import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@entities/session'
import { AppHeader } from '@widgets/app-header'

export function AuthGuard() {
  const s = useSession()
  if (s.loading) return <div className="min-h-screen grid place-items-center text-ink-faint">불러오는 중…</div>
  if (!s.userId) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
