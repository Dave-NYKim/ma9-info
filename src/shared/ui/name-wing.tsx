import { useId, type CSSProperties } from 'react'

/** 날개 SVG 본체 — 그라데이션 id 충돌 방지를 위해 인스턴스별 id 주입 (본체/잔상이 각자 다른 id 사용) */
function WingSvg({
  variant,
  id,
  className,
  style,
}: {
  variant: 'SG' | 'B'
  id: string
  className?: string
  style?: CSSProperties
}) {
  if (variant === 'B')
    return (
      <svg width={15} height={13} viewBox="0 0 26 22" className={className} style={style} aria-hidden>
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
  // 미러는 CSS(--flip)로 처리하므로 팔레트는 왼쪽 기준 고정, 오른쪽 팔레트는 부모(NameWing)에서 flip 시 결정.
  return (
    <svg width={14} height={14} viewBox="0 0 21 21" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="var(--wing-s0)" />
          <stop offset="100%" stopColor="var(--wing-s1)" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="var(--wing-b0)" />
          <stop offset="100%" stopColor="var(--wing-b1)" />
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

/** 실카드 이름 옆 장식 — SG=월계수 잎 · B=금색 깃털 날개. flip = 오른쪽(미러, --flip 변수).
 *  animated(베테랑 전용) = wing-aurora-*(숨쉬는 스케일 + 오로라 글로우) + wing-ghost-*(바깥쪽으로 퍼지는 잔상).
 *  기본(미지정) = 정적 날개 — 목록 카드 등 육성 정보 없는 곳. */
export function NameWing({
  variant,
  flip,
  animated = false,
  className,
}: {
  variant: 'SG' | 'B'
  flip?: boolean
  /** 베테랑 체크된 선수만 true — 오로라 + 잔상 활성 */
  animated?: boolean
  className?: string
}) {
  const id = useId()
  // SG 팔레트: 왼쪽 = 핑크·마젠타 / 오른쪽(flip) = 그린·퍼플 (실카드 동일)
  const pal = flip
    ? { s0: '#b2e878', s1: '#6fc73c', b0: '#b787ef', b1: '#8546d4' }
    : { s0: '#ffc4e0', s1: '#f57ab5', b0: '#f0559c', b1: '#c22572' }
  const style = {
    ['--flip']: flip ? -1 : 1,
    ['--wing-s0']: pal.s0,
    ['--wing-s1']: pal.s1,
    ['--wing-b0']: pal.b0,
    ['--wing-b1']: pal.b1,
  } as CSSProperties
  const aurora = variant === 'B' ? 'wing-aurora-b' : 'wing-aurora-sg'
  const ghost = variant === 'B' ? 'wing-ghost-b' : 'wing-ghost-sg'
  return (
    <span className={className ? `relative inline-flex ${className}` : 'relative inline-flex'} style={style} aria-hidden>
      {/* 잔상 — 본체 뒤에서 커지며 바깥쪽으로 (베테랑 전용) */}
      {animated && <WingSvg variant={variant} id={`${id}g`} className={`absolute inset-0 ${ghost}`} />}
      {/* 본체 — 베테랑이면 오로라, 아니면 정적 (flip 은 inline transform, 애니메이션 시 keyframe 이 덮음) */}
      <WingSvg
        variant={variant}
        id={id}
        className={animated ? aurora : undefined}
        style={animated ? undefined : { transform: 'scaleX(var(--flip,1))' }}
      />
    </span>
  )
}
