import { codeValues, teamsByLeague, type CodeMap } from '@entities/code'
import { Input, Select } from '@shared/ui'

export interface Filters {
  league?: string
  team?: string
  grade?: string
  q?: string
}

export function FilterBar({
  enums,
  value,
  onChange,
}: {
  enums: CodeMap | undefined
  value: Filters
  onChange: (f: Filters) => void
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select
        className="w-auto"
        value={value.league ?? ''}
        onChange={(e) => set({ league: e.target.value || undefined, team: undefined })}
      >
        <option value="">전체 리그</option>
        {codeValues(enums, 'league').map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>
      <Select className="w-auto" value={value.team ?? ''} onChange={(e) => set({ team: e.target.value || undefined })}>
        <option value="">전체 팀</option>
        {teamsByLeague(enums, value.league).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>
      <Select className="w-auto" value={value.grade ?? ''} onChange={(e) => set({ grade: e.target.value || undefined })}>
        <option value="">전체 등급</option>
        {codeValues(enums, 'grade').map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>
      <Input
        type="text"
        placeholder="이름 검색"
        className="w-auto flex-1 min-w-[140px]"
        value={value.q ?? ''}
        onChange={(e) => set({ q: e.target.value || undefined })}
      />
    </div>
  )
}
