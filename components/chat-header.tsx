import { PanelLeftIcon, ShareIcon } from "lucide-react";

type ChatHeaderProps = {
  /** 사이드바 토글. 접힘 상태는 상위(page)가 소유하므로 콜백만 받는다. */
  onToggleSidebar: () => void;
  /** 현재 대화 제목. */
  title?: string;
};

/**
 * 채팅 카드 상단 헤더 — 사이드바 토글 + 제목 + 공유.
 */
export function ChatHeader({ onToggleSidebar, title = "New Chat" }: ChatHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-4">
      <button
        onClick={onToggleSidebar}
        className="hover:bg-muted flex size-8 items-center justify-center rounded-md transition-colors"
        aria-label="Toggle sidebar"
      >
        <PanelLeftIcon className="size-4" />
      </button>
      <span className="text-sm font-medium">{title}</span>
      <button
        className="hover:bg-muted ml-auto flex size-8 items-center justify-center rounded-md transition-colors"
        aria-label="Share"
      >
        <ShareIcon className="size-4" />
      </button>
    </header>
  );
}
