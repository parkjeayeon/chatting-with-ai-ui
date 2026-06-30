"use client";

import {Thread} from "@/components/assistant-ui/thread";
import {ThreadList} from "@/components/assistant-ui/thread-list";
import {useAui, AuiProvider, Suggestions} from "@assistant-ui/react";
import {PanelLeftIcon, ShareIcon} from "lucide-react";
import {useState} from "react";
import {MyRuntimeProvider} from "./MyRuntimeProvider";

function ThreadWithSuggestions() {
    const aui = useAui({
        suggestions: Suggestions([
            {
                title: "What's the weather",
                label: "in San Francisco?",
                prompt: "What's the weather like in San Francisco today?",
            },
            {
                title: "Tell me about yourself",
                label: "and your capabilities",
                prompt: "What can you help me with?",
            },
        ]),
    });
    return (
        <AuiProvider value={aui}>
            <Thread/>
        </AuiProvider>
    );
}

export default function Home() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <MyRuntimeProvider>
            <div className="bg-muted/30 flex h-full w-full">
                {/* ── 사이드바 (항상 렌더링, width로 접기) ── */}
                <aside
                    className={
                        "flex shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-in-out " +
                        (sidebarCollapsed ? "w-14" : "w-64")
                    }
                >
                    {/* 로고: 아이콘은 항상, 텍스트만 페이드 아웃 */}
                    <div
                        className={
                            "flex h-12 shrink-0 items-center gap-2 transition-[padding] duration-300 " +
                            (sidebarCollapsed ? "px-4" : "px-6")
                        }
                    >
                        <div className="size-5 shrink-0 rounded bg-foreground/80"/>
                        <span
                            className={
                                "text-foreground/90 whitespace-nowrap text-sm font-medium transition-opacity duration-200 " +
                                (sidebarCollapsed ? "opacity-0" : "opacity-100")
                            }
                        >
              assistant-ui
            </span>
                    </div>
                    {/* 대화 목록: 접히면 페이드 아웃 */}
                    <div
                        className={
                            "flex-1 overflow-y-auto p-3 transition-opacity duration-200 " +
                            (sidebarCollapsed ? "pointer-events-none opacity-0" : "opacity-100")
                        }
                    >
                        <ThreadList/>
                    </div>
                </aside>
                {/* ── 채팅 영역 (카드형) ── */}
                <div className="flex flex-1 flex-col overflow-hidden p-2 md:pl-0">
                    <div className="bg-background flex flex-1 flex-col overflow-hidden rounded-lg border">
                        {/* 헤더: 토글 + 제목 + 공유 */}
                        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="hover:bg-muted flex size-8 items-center justify-center rounded-md transition-colors"
                                aria-label="Toggle sidebar"
                            >
                                <PanelLeftIcon className="size-4"/>
                            </button>
                            <span className="text-sm font-medium">New Chat</span>
                            <button
                                className="hover:bg-muted ml-auto flex size-8 items-center justify-center rounded-md transition-colors"
                                aria-label="Share"
                            >
                                <ShareIcon className="size-4"/>
                            </button>
                        </header>

                        {/* 채팅 본체 */}
                        <main className="flex-1 overflow-hidden">
                            <ThreadWithSuggestions/>
                        </main>
                    </div>
                </div>
            </div>
        </MyRuntimeProvider>
    );
}