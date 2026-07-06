/** 직접 그린 SVG 날씨 아이콘 (실제 마구마구 스프라이트로 교체 가능). 무속 = 초록 원. */
export function WeatherIcon({ name }: { name: string }) {
  const c = 'currentColor'
  switch (name) {
    case '해':
      return (
        <svg viewBox="0 0 24 24" width={21} height={21} fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round">
          <circle cx="12" cy="12" r="4.4" fill={c} stroke="none" />
          <line x1="12" y1="2.5" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="21.5" y2="12" />
          <line x1="5.3" y1="5.3" x2="7" y2="7" /><line x1="17" y1="17" x2="18.7" y2="18.7" />
          <line x1="18.7" y1="5.3" x2="17" y2="7" /><line x1="7" y1="17" x2="5.3" y2="18.7" />
        </svg>
      )
    case '구름':
      return (
        <svg viewBox="0 0 24 24" width={21} height={21} fill={c}>
          <path d="M7 18h9.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 7.6 9.2 4 4 0 0 0 7 18z" />
        </svg>
      )
    case '비':
      return (
        <svg viewBox="0 0 24 24" width={21} height={21}>
          <path fill={c} d="M7 15h9.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 7.6 6.2 4 4 0 0 0 7 15z" />
          <g stroke={c} strokeWidth={1.7} strokeLinecap="round">
            <line x1="8.5" y1="17.5" x2="7.5" y2="20.5" /><line x1="12" y1="17.5" x2="11" y2="20.5" />
            <line x1="15.5" y1="17.5" x2="14.5" y2="20.5" />
          </g>
        </svg>
      )
    case '눈':
      return (
        <svg viewBox="0 0 24 24" width={21} height={21}>
          <path fill={c} d="M7 15h9.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 7.6 6.2 4 4 0 0 0 7 15z" />
          <g fill={c}>
            <circle cx="8" cy="19" r="1.1" /><circle cx="12" cy="20" r="1.1" /><circle cx="16" cy="19" r="1.1" />
          </g>
        </svg>
      )
    default: // 무속
      return (
        <svg viewBox="0 0 24 24" width={21} height={21}>
          <circle cx="12" cy="12" r="7.5" fill={c} />
        </svg>
      )
  }
}

export const WEATHER_COLOR: Record<string, string> = {
  해: 'var(--sun)',
  구름: 'var(--cloud)',
  비: 'var(--rain)',
  눈: 'var(--snow)',
  무속: 'var(--none)',
}
