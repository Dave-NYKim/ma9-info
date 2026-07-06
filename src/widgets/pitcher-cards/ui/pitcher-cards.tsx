import type { PitcherWithPitches } from '@entities/pitcher'
import type { CodeMap } from '@entities/code'
import { PitcherCard } from './pitcher-card'

export function PitcherCards({
  rows,
  codes,
  onCard,
}: {
  rows: PitcherWithPitches[]
  codes: CodeMap | undefined
  onCard: (id: string) => void
}) {
  if (rows.length === 0)
    return <div className="rounded-xl border border-line bg-surface p-8 text-center text-ink-faint text-[.85rem]">투수 없음</div>

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
      {rows.map((p) => (
        <PitcherCard key={p.id} p={p} codes={codes} onClick={() => onCard(p.id)} />
      ))}
    </div>
  )
}
