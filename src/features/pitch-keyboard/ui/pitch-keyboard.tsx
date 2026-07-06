import { pitchesByKey, type CodeMap } from '@entities/code'
import { KEYBOARD_LAYOUT, PITCH_KEYS, PITCH_MAX, type PitchKey } from '@shared/config/domain'
import { Input } from '@shared/ui'
import { cn } from '@shared/lib/cn'

export interface KeyCell {
  base: string
  value: number | null
  special: boolean
  name: string
}
export type PitchState = Record<PitchKey, KeyCell>

export function emptyPitchState(): PitchState {
  const s = {} as PitchState
  for (const k of PITCH_KEYS) s[k] = { base: k === 'S' ? '포심' : '', value: null, special: false, name: '' }
  s.S.value = 80
  return s
}

export function countFilled(state: PitchState): number {
  return PITCH_KEYS.filter((k) => state[k].base).length
}

export function PitchKeyboard({
  value,
  onChange,
  enums,
  specialByKey,
}: {
  value: PitchState
  onChange: (v: PitchState) => void
  enums: CodeMap | undefined
  specialByKey: Record<string, string[]>
}) {
  const count = countFilled(value)
  const set = (k: PitchKey, patch: Partial<KeyCell>) => onChange({ ...value, [k]: { ...value[k], ...patch } })

  return (
    <div>
      <div className="flex justify-end mb-2">
        <span className={cn('font-mono text-[.72rem]', count >= PITCH_MAX ? 'text-[color:var(--accent)] font-bold' : 'text-ink-faint')}>
          {count} / {PITCH_MAX}
        </span>
      </div>
      <div
        className="grid gap-[6px] min-w-[560px]"
        style={{
          gridTemplateColumns: 'repeat(4,1fr)',
          gridTemplateAreas: '". kw . ." "ka ks kd kf" "kz kx kc ."',
        }}
      >
        {KEYBOARD_LAYOUT.map(({ key, area }) => {
          const c = value[key]
          const isBase = key === 'S'
          const filled = !!c.base
          const locked = !filled && !isBase && count >= PITCH_MAX
          const opts = isBase ? ['포심'] : pitchesByKey(enums, key)
          return (
            <div
              key={key}
              style={{ gridArea: area }}
              className={cn(
                'border-[1.5px] rounded-[9px] p-[6px] flex flex-col gap-[4px] bg-surface-2',
                filled && 'bg-surface',
                isBase ? 'border-[color:var(--gold)]' : c.special ? 'border-[color:var(--blue)]' : filled ? 'border-[color:var(--accent)]' : 'border-line-strong',
                locked && 'opacity-45',
              )}
            >
              <div className="flex items-center gap-[5px]">
                <span
                  className="font-mono font-extrabold text-[.72rem] w-[19px] h-[19px] grid place-items-center rounded-[5px] text-white flex-none"
                  style={{ background: isBase ? 'var(--gold)' : c.special ? 'var(--blue)' : 'var(--ink)' }}
                >
                  {key}
                </span>
                {!isBase && (
                  <label className="ml-auto text-[.58rem] font-bold text-[color:var(--blue)] inline-flex items-center gap-[3px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={c.special}
                      disabled={!filled || locked}
                      onChange={(e) => set(key, { special: e.target.checked, name: e.target.checked ? c.name : '' })}
                    />
                    특이
                  </label>
                )}
              </div>
              <select
                disabled={isBase || locked}
                value={c.base}
                onChange={(e) => set(key, { base: e.target.value, ...(e.target.value ? {} : { special: false, name: '', value: null }) })}
                className="w-full text-[.74rem] px-[6px] py-[4px] rounded-md border border-line-strong bg-surface-2 text-ink disabled:opacity-60"
              >
                {!isBase && <option value="">—</option>}
                {opts.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              {c.special && (
                <>
                  <Input
                    list={`sp-${key}`}
                    type="text"
                    placeholder="특이구종명 (예: MM커터)"
                    value={c.name}
                    onChange={(e) => set(key, { name: e.target.value })}
                    className="text-[.8rem]"
                  />
                  <datalist id={`sp-${key}`}>
                    {(specialByKey[key] ?? []).map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </>
              )}
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="수치"
                disabled={!filled && !isBase}
                value={c.value ?? ''}
                onChange={(e) => set(key, { value: e.target.value ? Number(e.target.value) : null })}
                className="text-[.74rem]"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
