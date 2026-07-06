import { APP_VERSION } from "@shared/config/version";

export function AppFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="flex items-center justify-between px-4 py-3 max-w-[1300px] mx-auto text-[.72rem] text-ink-faint">
        <span>
          Made by <b className="text-ink-soft">Uchoon</b> with Claude Code ⚾
        </span>
        <span className="tabular-nums">{APP_VERSION}</span>
      </div>
    </footer>
  );
}
