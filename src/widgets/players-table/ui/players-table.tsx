import { gradeCssVar } from '@shared/config/grades'

export interface PlayerRow {
  id: string
  name: string
  team_code: string
  grade: string
  position: string | null
  year: number | null
}

export function PlayersTable({ rows, onRow }: { rows: PlayerRow[]; onRow: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-line bg-surface overflow-auto shadow-[var(--shadow)]">
      <table className="w-full text-[.86rem] border-collapse [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2">
        <thead>
          <tr className="text-left text-[.66rem] uppercase tracking-[.1em] text-ink-faint border-b border-line-strong bg-surface-2">
            <th>이름</th>
            <th>팀</th>
            <th>등급</th>
            <th>포지션</th>
            <th className="text-right">연도</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRow(r.id)}
              className="border-t border-line hover:bg-surface-2 cursor-pointer"
            >
              <td className="font-semibold">{r.name}</td>
              <td className="font-mono">{r.team_code}</td>
              <td className="font-extrabold" style={{ color: `var(${gradeCssVar(r.grade)})` }}>
                {r.grade}
              </td>
              <td className="font-mono">{r.position ?? '—'}</td>
              <td className="font-mono tabular-nums text-ink-faint text-right">{r.year ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="p-8 text-center text-ink-faint text-[.85rem]">선수 없음</div>}
    </div>
  )
}
