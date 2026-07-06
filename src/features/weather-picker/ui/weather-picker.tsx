import { WEATHERS } from '@shared/config/domain'
import { cn } from '@shared/lib/cn'
import { WEATHER_COLOR, WeatherIcon } from './icons'

/** 아이콘 한 줄에서 주/부 지정(겹칠 수 없음). 클릭: 없음→주→부, 재클릭 해제. */
export function WeatherPicker({
  primary,
  secondary,
  onChange,
}: {
  primary: string | null
  secondary: string | null
  onChange: (primary: string | null, secondary: string | null) => void
}) {
  const click = (w: string) => {
    if (primary === w) onChange(null, secondary)
    else if (secondary === w) onChange(primary, null)
    else if (!primary) onChange(w, secondary)
    else if (!secondary) onChange(primary, w)
    else onChange(primary, w)
  }

  return (
    <div>
      <div className="flex gap-[6px]">
        {WEATHERS.map((w) => {
          const role = primary === w ? '주' : secondary === w ? '부' : null
          return (
            <button
              key={w}
              type="button"
              onClick={() => click(w)}
              title={w}
              style={{ color: WEATHER_COLOR[w] }}
              className={cn(
                'relative flex-1 h-12 rounded-[11px] border-[1.5px] bg-surface-2 flex flex-col items-center justify-center cursor-pointer transition',
                role === '주' && 'border-[color:var(--clay)] shadow-[0_0_0_1px_var(--clay)]',
                role === '부' && 'border-[color:var(--blue)]',
                !role && 'border-line-strong hover:border-ink-faint',
              )}
            >
              {role && (
                <span
                  className="absolute -top-[7px] -right-[4px] text-[.53rem] font-extrabold text-white rounded-full px-[5px]"
                  style={{ background: role === '주' ? 'var(--clay)' : 'var(--blue)' }}
                >
                  {role}
                </span>
              )}
              <WeatherIcon name={w} />
              <span className="text-[.53rem] font-bold text-ink-faint">{w}</span>
            </button>
          )
        })}
      </div>
      <div className="text-[.67rem] text-ink-faint mt-[6px]">
        주날씨 {primary ?? '—'} · 부날씨 {secondary ?? '—'}
      </div>
    </div>
  )
}
