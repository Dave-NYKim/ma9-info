import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePitcherCards, type PitcherWithPitches } from '@entities/pitcher'
import { useCodes } from '@entities/code'
import { DataTable, FilterBar, type Column, type Filters } from '@widgets/players-table'
import { PitcherCards } from '@widgets/pitcher-cards'
import { gradeCssVar } from '@shared/config/grades'
import { Button, Segmented } from '@shared/ui'

const gradeCell = (g: string) => (
  <span className="font-extrabold" style={{ color: `var(${gradeCssVar(g)})` }}>
    {g}
  </span>
)

const columns: Column<PitcherWithPitches>[] = [
  { key: 'grade', label: '등급', render: (p) => gradeCell(p.grade) },
  { key: 'name', label: '이름', render: (p) => <span className="font-semibold">{p.name}</span> },
  { key: 'team_code', label: '팀' },
  { key: 'position', label: '포지션', render: (p) => (p.dual_position ? `${p.position}/${p.dual_position}` : p.position) },
  { key: 'stamina', label: '체력', align: 'right' },
  { key: 'control', label: '제구', align: 'right' },
  { key: 'levelup_pitch', label: '성장', align: 'right', render: (p) => p.levelup_pitch ?? '—' },
  { key: 'special_form', label: '특이폼', align: 'right', render: (p) => (p.special_form ? 'Y' : '·') },
  { key: 'year', label: '연도', align: 'right', render: (p) => p.year ?? '—' },
]

const VIEWS = ['카드', '표'] as const

export function PitchersPage() {
  const nav = useNavigate()
  const { data: codes } = useCodes()
  const [filters, setFilters] = useState<Filters>({})
  const [view, setView] = useState<(typeof VIEWS)[number]>('카드')
  const { data, isLoading } = usePitcherCards(filters)
  const rows = data?.items ?? []

  return (
    <div className="p-4 flex flex-col gap-3 max-w-[1300px] mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold">투수</h1>
        <span className="text-ink-faint text-sm tabular-nums">{data?.total ?? 0}명</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-[120px]">
            <Segmented options={VIEWS} value={view} onChange={(v) => setView(v as (typeof VIEWS)[number])} />
          </div>
          <Button variant="primary" onClick={() => nav('/pitchers/new')}>
            + 투수 등록
          </Button>
        </div>
      </div>
      <FilterBar enums={codes} value={filters} onChange={setFilters} />
      {isLoading ? (
        <div className="p-8 text-center text-ink-faint">불러오는 중…</div>
      ) : view === '카드' ? (
        <PitcherCards rows={rows} codes={codes} onCard={(id) => nav(`/pitchers/${id}`)} />
      ) : (
        <DataTable rows={rows} columns={columns} onRow={(id) => nav(`/pitchers/${id}`)} />
      )}
    </div>
  )
}
