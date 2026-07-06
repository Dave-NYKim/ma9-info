import atl from "@shared/assets/teams/atl.webp";
import sd from "@shared/assets/teams/sd.webp";

/** 팀 코드 → 로고. 없는 팀은 미표시(코드 텍스트만 남음). 팀 늘릴 땐 여기 한 줄씩. */
const TEAM_MARK: Record<string, string> = {
  ATL: atl,
  SD: sd,
};

export function hasTeamMark(code: string | null | undefined): boolean {
  return !!code && code in TEAM_MARK;
}

/** 팀 로고 마크. 로고 없는 팀이면 아무것도 렌더 안 함. */
export function TeamMark({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const src = code ? TEAM_MARK[code] : undefined;
  if (!src) return null;
  return (
    <img
      src={src}
      alt={`${code} 로고`}
      loading="lazy"
      className={className ?? "h-4 w-4 shrink-0 object-contain"}
    />
  );
}

/** 카드 배경 워터마크 — 팀 로고를 우측 하단에 은은하게. 로고 없는 팀이면 미표시.
 *  부모에 relative + overflow-hidden 필요(코너로 살짝 넘겨 자름). */
export function TeamWatermark({ code }: { code: string | null | undefined }) {
  const src = code ? TEAM_MARK[code] : undefined;
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      className="pointer-events-none absolute -bottom-3 -right-1 z-0 h-24 w-24 select-none object-contain opacity-[0.25]"
    />
  );
}
