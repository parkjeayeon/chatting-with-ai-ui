import { ThreadList } from "@/components/assistant-ui/thread-list";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

type SidebarProps = {
  /** 접힘 여부. 접기 상태는 상위(page)가 소유하고 prop으로 내려준다. */
  collapsed: boolean;
};

/**
 * 좌측 사이드바 — 로고 + 대화 목록(ThreadList).
 * 토글 버튼과 접힘 상태는 상위에 있고, 여기서는 `collapsed`만 받아 표현한다.
 */
export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {/* 로고: 아이콘은 항상, 텍스트만 페이드 아웃 */}
      <div
        className={cn(
          "flex h-12 shrink-0 items-center gap-2 transition-[padding] duration-300",
          collapsed ? "px-4" : "px-6",
        )}
      >
        <Logo />
        <span
          className={cn(
            "text-foreground/90 text-sm font-medium whitespace-nowrap transition-opacity duration-200",
            collapsed ? "opacity-0" : "opacity-100",
          )}
        >
          assistant-ui
        </span>
      </div>
      {/* 대화 목록: 접히면 페이드 아웃 */}
      <div
        className={cn(
          "flex-1 overflow-y-auto p-3 transition-opacity duration-200",
          collapsed ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <ThreadList />
      </div>
    </aside>
  );
}
