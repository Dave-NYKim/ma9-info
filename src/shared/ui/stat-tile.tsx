import { STAT_MIN, STAT_MAX } from '@shared/config/domain'

/** 스탯 타일 (타자·투수 공용) — 라벨 위 · 값 아래.
 *  growth = 레벨업 대상(라벨 옆 ↑) · special = 특이구종(라벨 clay 색)
 *  값 색: 80 이상 금색(마구마구 관례) · 부포지션 보정(delta) 중엔 증감색 우선 */
export function StatTile({
  label,
  value,
  growth,
  special,
  delta = 0,
}: {
  label: string
  value: number | null
  growth?: boolean
  special?: boolean
  delta?: number
}) {
  const shown = value == null ? null : Math.max(STAT_MIN, Math.min(STAT_MAX, value + delta))
  const dc = delta > 0 ? 'var(--green)' : 'var(--g-r)'
  const hot = shown != null && shown >= 80
  return (
    <div className="rounded-md px-1.5 py-1 text-center bg-surface-2">
      <div
        className="text-[.6rem] leading-tight truncate"
        style={{ color: special ? 'var(--clay)' : 'var(--ink-faint)' }}
        title={growth ? `${label} (레벨업)` : special ? `${label} (특이구종)` : label}
      >
        {label}
        {growth && '↑'}
      </div>
      <div className="font-mono font-bold tabular-nums text-[.92rem] leading-tight flex items-baseline justify-center gap-0.5">
        <span style={delta ? { color: dc } : hot ? { color: 'var(--gold)' } : undefined}>{shown ?? '—'}</span>
        {delta !== 0 && (
          <span className="text-[.54rem] font-bold" style={{ color: dc }}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    </div>
  )
}
