import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Input, Labeled } from '@shared/ui'
import { signIn } from '../model/use-auth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await signIn(email, password)
      toast.success('로그인되었습니다')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '로그인 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 w-full max-w-[320px]">
      <Labeled label="이메일">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
      </Labeled>
      <Labeled label="비밀번호">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </Labeled>
      <Button type="submit" variant="primary" disabled={busy} className="mt-1">
        {busy ? '로그인 중…' : '로그인'}
      </Button>
    </form>
  )
}
