import type { Batter } from '@entities/batter'
import type { CodeMap } from '@entities/code'
import { BatterCard } from './batter-card'

export function BatterCards({
  rows,
  codes,
  onCard,
}: {
  rows: Batter[]
  codes: CodeMap | undefined
  onCard: (id: string) => void
}) {
  if (rows.length === 0)
    return <div className="rounded-xl border border-line bg-surface p-8 text-center text-ink-faint text-[.85rem]">타자 없음</div>

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
      {rows.map((b) => (
        <BatterCard key={b.id} b={b} codes={codes} onClick={() => onCard(b.id)} />
      ))}
    </div>
  )
}
