import { AuiProvider, Suggestions, useAui, SuggestionConfig } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";

const suggestions: SuggestionConfig[] = [
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
];

export function ThreadWithSuggestions() {
  // useAui(config) 는 상위(AssistantRuntimeProvider 가 제공하는) AssistantClient 를
  // "확장"해서, 여기 트리에서 쓸 UI 스코프를 얹는다. 반환된 aui 를 AuiProvider 로
  // 내려주면 자식(Thread 등)이 그 스코프를 공유한다.
  //
  // 여기에 넣을 수 있는 것들(모두 @assistant-ui/react 의 빌더로 값 생성):
  //   suggestions : Suggestions([...])   // 빈 스레드의 시작 제안 칩 (지금 이거)
  //   tools       : Tools({ toolkit })   // 프론트 도구 구현 + 툴콜 UI 렌더 등록
  //                                      //   (백엔드가 부르는 tool 을 브라우저에서
  //                                      //    실행/승인/렌더링. HITL 승인 UI도 여기)
  //   dataRenderers : DataRenderers({..})// 백엔드가 흘리는 커스텀 data part 렌더러
  //   interactables : unstable_Interactables(...) // 생성형 인터랙티브 UI(실험적)
  //
  // 여러 개를 동시에 얹을 수 있다. 예:
  //   const aui = useAui({
  //     suggestions: Suggestions(suggestions),
  //     tools: Tools({ toolkit }),
  //   });
  //
  // 참고 — 인자 없는 useAui() 는 "읽기/명령"용이다(확장 아님):
  //   const aui = useAui();
  //   aui.composer().send();      // 메시지 전송
  //   aui.thread().cancelRun();   // 실행 취소
  //   그리고 반응형 상태는 useAuiState((s) => s.thread.isRunning) 처럼 구독한다.
  const aui = useAui({
    suggestions: Suggestions(suggestions),
  });

  return (
    <AuiProvider value={aui}>
      <Thread />
    </AuiProvider>
  );
}
