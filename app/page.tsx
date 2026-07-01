"use client";

import { ChatHeader } from "@/components/chat-header";
import { Sidebar } from "@/components/sidebar";
import { useState } from "react";
import { MyRuntimeProvider } from "../components/provider/my-runtime-provider";
import { ThreadWithSuggestions } from "@/components/provider/thread-with-suggestions";

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <MyRuntimeProvider>
      <div className="bg-muted/30 flex h-full w-full">
        {/* ── 사이드바 (접힘 상태는 여기서 소유, 컴포넌트로 분리) ── */}
        <Sidebar collapsed={sidebarCollapsed} />
        {/* ── 채팅 영역 (카드형) ── */}
        <div className="flex flex-1 flex-col overflow-hidden p-2 md:pl-0">
          <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg border">
            {/* 헤더: 토글 + 제목 + 공유 */}
            <ChatHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
            {/* 채팅 본체 */}
            <main className="flex-1 overflow-hidden">
              <ThreadWithSuggestions />
            </main>
          </div>
        </div>
      </div>
    </MyRuntimeProvider>
  );
}
