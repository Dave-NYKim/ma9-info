import { useId } from 'react'

/** 실카드 이름 옆 장식 (SVG 재현) — SG=월계수 잎(시안·퍼플·흰빛 홀로) · B=금색 깃털 날개(층층 깃털+말린 머리).
 *  기본 = 왼쪽 장식(바깥으로 펼침), flip = 오른쪽(미러). */
export function NameWing({ variant, flip, className }: { variant: 'SG' | 'B'; flip?: boolean; className?: string }) {
  const id = useId()
  const style = flip ? { transform: 'scaleX(-1)' as const } : undefined

  if (variant === 'B')
    return (
      <svg width={15} height={13} viewBox="0 0 26 22" className={className} aria-hidden style={style}>
        <defs>
          <linearGradient id={id} x1="0.15" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#f8e79e" />
            <stop offset="45%" stopColor="#e6b94e" />
            <stop offset="100%" stopColor="#a0721e" />
          </linearGradient>
        </defs>
        {/* 축/몸통 — 오른쪽에서 깃털 뿌리를 잇고 아래로 꼬리 */}
        <path d="M20.5 7 C 22 10.5, 22.4 15, 21 21.5 C 20 17, 19.4 12.5, 19 8.5 Z" fill={`url(#${id})`} />
        {/* 깃털 4장 — 평행 계단식, 왼쪽 위가 가장 높고 김 */}
        <path d="M20 8.5 C 14 3.5, 6.5 1.2, 1 2.6 C 6 6.4, 13.5 8.8, 20 8.5 Z" fill={`url(#${id})`} />
        <path d="M20 11.8 C 14 8.2, 7 6.8, 2.5 8.2 C 7.5 11.4, 14.5 12.8, 20 11.8 Z" fill={`url(#${id})`} />
        <path d="M19.5 15 C 14.5 12.2, 8.5 11.4, 4.5 12.6 C 9 15.4, 15 16.2, 19.5 15 Z" fill={`url(#${id})`} />
        <path d="M18.5 18 C 14.5 16.2, 10.5 15.8, 7.2 16.8 C 10.5 18.9, 15.5 19.3, 18.5 18 Z" fill={`url(#${id})`} />
        {/* 최상단 깃털 흰 하이라이트 */}
        <path d="M18.5 7 C 13 2.8, 6.5 1.2, 2.4 2.2 C 7.5 2.4, 13.5 4.6, 18.5 7 Z" fill="#fff6da" opacity="0.9" />
      </svg>
    )

  // 시그니처 — V자 잎 2장 + 아래 가로 잎. 실카드처럼 좌우 팔레트가 다름(왼쪽 핑크·마젠타 / 오른쪽 그린·퍼플)
  const pal = flip
    ? { side: ['#b2e878', '#6fc73c'], base: ['#b787ef', '#8546d4'] }
    : { side: ['#ffc4e0', '#f57ab5'], base: ['#f0559c', '#c22572'] }
  return (
    <svg width={14} height={14} viewBox="0 0 21 21" className={className} aria-hidden style={style}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={pal.side[0]} />
          <stop offset="100%" stopColor={pal.side[1]} />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={pal.base[0]} />
          <stop offset="100%" stopColor={pal.base[1]} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d9e2f8" />
        </linearGradient>
      </defs>
      {/* 아래 가로 잎 */}
      <path d="M18 14 C 12.5 12.8, 5.5 14, 1 17.5 C 6 19.8, 13.5 18.4, 18 14 Z" fill={`url(#${id}b)`} />
      {/* 왼쪽 위 흰 잎 */}
      <path d="M11.5 14.5 C 5.5 11.5, 2.2 6, 2.8 1.2 C 8.2 4, 11.2 9, 11.5 14.5 Z" fill={`url(#${id}w)`} />
      {/* 오른쪽 위 색 잎 */}
      <path d="M12.5 14.5 C 13 9, 15.5 4, 19.5 1.8 C 19 6.5, 16.5 11.5, 12.5 14.5 Z" fill={`url(#${id}s)`} />
    </svg>
  )
}
