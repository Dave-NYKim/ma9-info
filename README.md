# MA9 Info — Frontend (FSD)

백엔드리스: 이 프론트가 Supabase(Postgres+Auth+RLS)에 직접 붙는다. 자체 서버 없음.

## 아키텍처 (Feature-Sliced Design)
```
src/
  app/        앱 초기화 · 프로바이더 · 라우터 · 전역 스타일(토큰)
  pages/      라우트 단위 화면 (조합만)
  widgets/    큰 UI 블록 (player-form, players-table, app-header)
  features/   사용자 상호작용 (auth, grade-select, weather-picker, ...)
  entities/   비즈니스 엔티티 (batter, pitcher, enum, potential, session)
  shared/     재사용 (ui 키트, api=supabase, lib, config=디자인토큰·도메인상수)
```
의존 방향: `app → pages → widgets → features → entities → shared` (아래로만 import).

## 실행
```bash
pnpm i          # 또는 npm i
cp .env.example .env   # Supabase URL/anon key 채우기
pnpm dev
```

## 배포 (GitHub Pages)
```bash
pnpm build && pnpm deploy   # gh-pages 브랜치로 dist 배포
```
SPA 라우팅은 HashRouter라 GitHub Pages에서 404 없이 동작.
