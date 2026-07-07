import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSession } from '@entities/session'
import { useRosters, useCreateRoster, type RosterListItem } from '@entities/roster'
import { LINEUP_SIZE } from '@shared/config/roster'
import { Badge, Button, Input, Segmented } from '@shared/ui'

const SCOPES = ['내 팀', '전체'] as const

export function RostersPage() {
  const nav = useNavigate()
  const { userId } = useSession()
  const [scope, setScope] = useState<(typeof SCOPES)[number]>('내 팀')
  const { data: rosters = [], isLoading } = useRosters(scope === '내 팀' ? 'mine' : 'all', userId)
  const createMut = useCreateRoster()
  const [name, setName] = useState('')

  const create = () => {
    const n = name.trim()
    if (!n) return
    createMut.mutate(n, {
      onSuccess: (r) => {
        setName('')
        toast(`팀 「${r.name}」 생성 — 라인업을 짜보세요`)
        nav(`/rosters/${r.id}`)
      },
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <div className="p-4 flex flex-col gap-3 max-w-[1300px] mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-extrabold">팀</h1>
        <span className="text-ink-faint text-sm tabular-nums">{rosters.length}팀</span>
        <div className="w-[150px]">
          <Segmented options={SCOPES} value={scope} onChange={(v) => setScope(v as (typeof SCOPES)[number])} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder="새 팀 이름"
            className="w-[180px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <Button variant="primary" disabled={!name.trim() || createMut.isPending} onClick={create}>
            + 팀 만들기
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-ink-faint">불러오는 중…</div>
      ) : rosters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong p-10 text-center text-ink-faint text-[.9rem]">
          {scope === '내 팀' ? '아직 팀이 없습니다 — 위에서 첫 팀을 만들어보세요 ⚾' : '아직 아무도 팀을 만들지 않았어요'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rosters.map((r) => (
            <RosterCard key={r.id} r={r} mine={r.user_id === userId} onOpen={() => nav(`/rosters/${r.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function RosterCard({ r, mine, onOpen }: { r: RosterListItem; mine: boolean; onOpen: () => void }) {
  const n = r.roster_players?.[0]?.count ?? 0
  const complete = n >= LINEUP_SIZE
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow)] transition hover:-translate-y-px hover:brightness-[1.02] cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 truncate text-[1.02rem] font-extrabold">{r.name}</h3>
        {mine && <Badge color="var(--accent)">내 팀</Badge>}
      </div>
      <div className="mt-0.5 text-[.76rem] text-ink-faint truncate">{r.owner?.email ?? '—'}</div>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono tabular-nums font-extrabold text-[.95rem]">
          {n}
          <span className="text-ink-faint font-normal">/{LINEUP_SIZE}</span>
        </span>
        {complete ? <Badge color="var(--green)">라인업 완성</Badge> : <Badge color="var(--gold)">미완성</Badge>}
        <span className="ml-auto text-[.72rem] text-ink-faint tabular-nums">
          {new Date(r.updated_at).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </button>
  )
}
