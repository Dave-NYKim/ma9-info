import type { PotentialInfo } from '../model/use-potentials'

/** 툴팁에 보여줄 내용이 있는가 (효과류가 하나라도) */
export const hasPotentialTip = (info: PotentialInfo | undefined): info is PotentialInfo =>
  !!info && !!(info.description || info.effect || info.enhanced_effect)

/** '*' 앞에서 줄바꿈 (마구마구 설명 관례 — *발동조건 등). whitespace-pre-line 과 함께 사용 */
const starBreak = (t: string) => t.replace(/\s*\*/g, '\n*').trimStart()

/** 잠재력 툴팁 본문 — 이름 · 설명 · 효과 · 강화효과. accent = 이름 색(잠재력 green · 베테랑 purple) */
export function PotentialTipBody({ info, accent = 'var(--green)' }: { info: PotentialInfo; accent?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-bold" style={{ color: accent }}>
        {info.name}
      </div>
      {info.description && <div className="text-ink-soft whitespace-pre-line">{starBreak(info.description)}</div>}
      {info.effect && (
        <div>
          <span className="font-bold text-ink-faint mr-1">효과</span>
          <span className="whitespace-pre-line">{starBreak(info.effect)}</span>
        </div>
      )}
      {info.enhanced_effect && (
        <div>
          <span className="font-bold text-ink-faint mr-1">강화</span>
          <span className="whitespace-pre-line">{starBreak(info.enhanced_effect)}</span>
        </div>
      )}
    </div>
  )
}
