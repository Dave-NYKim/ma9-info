import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBatters, type Batter } from '@entities/batter'
import { useCodes } from '@entities/code'
import { DataTable, FilterBar, type Column, type Filters } from '@widgets/players-table'
import { BatterCards } from '@widgets/batter-cards'
import { gradeCssVar } from '@shared/config/grades'
import { Button, Segmented } from '@shared/ui'

const gradeCell = (g: string) => (
  <span className="font-extrabold" style={{ color: `var(${gradeCssVar(g)})` }}>
    {g}
  </span>
)

const columns: Column<Batter>[] = [
  { key: 'grade', label: '등급', render: (b) => gradeCell(b.grade) },
  { key: 'name', label: '이름', render: (b) => <span className="font-semibold">{b.name}</span> },
  { key: 'team_code', label: '팀' },
  { key: 'position', label: '포지션', render: (b) => (b.dual_position ? `${b.position}/${b.dual_position}` : b.position) },
  { key: 'power', label: '파워', align: 'right' },
  { key: 'contact', label: '컨택', align: 'right' },
  { key: 'speed', label: '스피드', align: 'right' },
  { key: 'throwing', label: '쓰로', align: 'right' },
  { key: 'defense', label: '수비', align: 'right' },
  { key: 'clutch', label: '클러치', align: 'right' },
  { key: 'special_form', label: '특이폼', align: 'right', render: (b) => (b.special_form ? 'Y' : '·') },
  { key: 'year', label: '연도', align: 'right', render: (b) => b.year ?? '—' },
]

const VIEWS = ['카드', '표'] as const

export function BattersPage() {
  const nav = useNavigate()
  const { data: codes } = useCodes()
  const [filters, setFilters] = useState<Filters>({})
  const [view, setView] = useState<(typeof VIEWS)[number]>('카드')
  const { data, isLoading } = useBatters(filters)
  const rows = data?.items ?? []

  return (
    <div className="p-4 flex flex-col gap-3 max-w-[1300px] mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold">타자</h1>
        <span className="text-ink-faint text-sm tabular-nums">{data?.total ?? 0}명</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-[120px]">
            <Segmented options={VIEWS} value={view} onChange={(v) => setView(v as (typeof VIEWS)[number])} />
          </div>
          <Button variant="primary" onClick={() => nav('/batters/new')}>
            + 타자 등록
          </Button>
        </div>
      </div>
      <FilterBar enums={codes} value={filters} onChange={setFilters} />
      {isLoading ? (
        <div className="p-8 text-center text-ink-faint">불러오는 중…</div>
      ) : view === '카드' ? (
        <BatterCards rows={rows} codes={codes} onCard={(id) => nav(`/batters/${id}`)} />
      ) : (
        <DataTable rows={rows} columns={columns} onRow={(id) => nav(`/batters/${id}`)} />
      )}
    </div>
  )
}
