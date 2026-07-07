import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@entities/session";
import { signOut } from "@features/auth";
import { Button } from "@shared/ui";
import { cn } from "@shared/lib/cn";
import logo from "@shared/assets/brand/magumagu.png";

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-4 py-[6px] rounded-lg text-[.85rem] font-bold",
          isActive
            ? "bg-ink text-[color:var(--surface)]"
            : "text-ink-soft hover:bg-surface-2",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function AppHeader() {
  const s = useSession();
  return (
    <header className="border-b border-line bg-surface sticky top-0 z-20">
      {/* 내용은 본문과 같은 폭(1300px)으로 정렬 — 배경·보더만 풀폭 */}
      <div className="flex items-center gap-4 px-4 py-2 max-w-[1300px] mx-auto">
        <div className="flex items-center gap-2 font-extrabold text-[.95rem]">
          <img
            src={logo}
            alt="마구마구"
            className="h-8 w-auto object-contain"
          />
          Ma9tiz
        </div>
        <nav className="flex gap-1">
          <Tab to="/batters">타자</Tab>
          <Tab to="/pitchers">투수</Tab>
          <Tab to="/potentials">잠재력</Tab>
          <Tab to="/rosters">팀</Tab>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-[.8rem] text-ink-soft">
          {s.email && (
            <span className="hidden sm:inline">
              {s.email} · <b className="text-ink">{s.role}</b>
            </span>
          )}
          <Button
            variant="ghost"
            onClick={async () => {
              await signOut();
              toast("로그아웃되었습니다");
            }}
          >
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
