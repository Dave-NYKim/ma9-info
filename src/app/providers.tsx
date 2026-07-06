import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { SessionProvider } from '@entities/session'
import { queryClient } from '@shared/lib/query'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster position="bottom-center" richColors />
      </SessionProvider>
    </QueryClientProvider>
  )
}
