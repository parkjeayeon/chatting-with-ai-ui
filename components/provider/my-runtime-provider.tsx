"use client";

import {
  AssistantRuntimeProvider,
  Tools,
  generateId,
  type AssistantTransportConnectionMetadata,
  type ThreadMessageLike,
  unstable_createMessageConverter as createMessageConverter,
  useAui,
  useAssistantTransportRuntime,
  SimpleImageAttachmentAdapter,
  CompositeAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { GenericFileAttachmentAdapter } from "@/lib/file-attachment-adapter";
import toolkit from "../../app/toolkit";
import { DevToolsModal, createDevToolsPlugin } from "@assistant-ui/react-devtools";

const stateTab = createDevToolsPlugin({
  id: "my-state",
  label: "My state",
  Component: ({ data }) => <pre>{JSON.stringify(data.state, null, 2)}</pre>,
});

type MyRuntimeProviderProps = {
  children: ReactNode;
};

// 백엔드가 흘리는 메시지 스키마 (LangChain human/ai 대신 role 사용)
// type: "image" | "document" | "file" | ... (BaseAttachment.type). 다만 AssistantTransport 는
// text/image 파트만 넘기므로 실제로는 image(이미지) 또는 document(텍스트)만 도달한다.
type StateAttachment = {
  id: string;
  type: string;
  name: string;
  content: unknown[]; // [{type:"text",text}] | [{type:"image",image}]
};
type StateMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  attachments?: StateAttachment[];
};
type State = { messages: StateMessage[] };

// SimpleTextAttachmentAdapter 래퍼: <attachment name=NAME>\n내용\n</attachment>
const ATTACHMENT_RE = /^<attachment name=(.+?)>\n([\s\S]*)\n<\/attachment>$/;
// GenericFileAttachmentAdapter 참조: <file id=FILEID name=NAME/>
const FILE_REF_RE = /^<file id=(\S+) name=(.+?)\s*\/>$/;

// pending add-message 커맨드 → StateMessage (낙관적 렌더용, 백엔드 파싱과 동일 규칙)
const commandToStateMessage = (c: { message: { parts: any[] } }): StateMessage => {
  const attachments: StateAttachment[] = [];
  const typed: string[] = [];
  for (const p of c.message.parts) {
    if (p.type === "text") {
      const m = ATTACHMENT_RE.exec(p.text ?? "");
      const mf = FILE_REF_RE.exec(p.text ?? "");
      if (m) {
        attachments.push({
          id: generateId(),
          type: "document",
          name: m[1],
          content: [{ type: "text", text: m[2] }],
        });
      } else if (mf) {
        attachments.push({ id: mf[1], type: "file", name: mf[2], content: [] });
      } else {
        typed.push(p.text ?? "");
      }
    } else if (p.type === "image") {
      attachments.push({
        id: generateId(),
        type: "image",
        name: "image",
        content: [{ type: "image", image: p.image }],
      });
    }
  }
  return { role: "user", content: typed.join("\n"), attachments };
};

// StateMessage → assistant-ui ThreadMessage
const messageConverter = createMessageConverter((msg: StateMessage): ThreadMessageLike => {
  if (msg.role === "assistant") {
    return { role: "assistant", content: msg.content ?? "" };
  }
  return {
    role: "user",
    content: msg.content ?? "",
    attachments: (msg.attachments ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      content: a.content as any,
      status: { type: "complete" as const },
    })),
  };
});

const converter = (state: State, connectionMetadata: AssistantTransportConnectionMetadata) => {
  const optimistic = connectionMetadata.pendingCommands
    .filter((c) => c.type === "add-message")
    .map((c) => commandToStateMessage(c as any));

  const messages = [...(state.messages ?? []), ...optimistic];
  return {
    messages: messageConverter.toThreadMessages(messages),
    isRunning: connectionMetadata.isSending || false,
  };
};

export function MyRuntimeProvider({ children }: MyRuntimeProviderProps) {
  const runtime = useAssistantTransportRuntime({
    initialState: {
      messages: [],
    },
    api: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010/assistant",
    converter,
    // ExternalStore 기반 런타임은 편집을 기본 미지원 → 명시적으로 켠다.
    // 다만 일단은 manus와 동일하게 branch tree가 아니라 flat list로 진행(수정 X)
    // capabilities: { edit: true },
    headers: async () => ({
      "Test-Header": "test-value",
    }),
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
        // 그 외 임의 파일(zip 등) — 와일드카드는 반드시 마지막
        new GenericFileAttachmentAdapter(),
      ]),
    },
    body: {
      "Test-Body": "test-value",
    },
    prepareSendCommandsRequest: (body) => {
      // ⬇️ 백엔드로 POST 하기 직전의 전체 페이로드 (여기가 "보내기 전" 지점)
      console.log("[→ backend] full body:", body);
      // 커맨드별 parts (첨부가 text/image 파트로 펼쳐진 원본)
      body.commands?.forEach((c: any, i: number) => {
        console.log(`[→ backend] command[${i}] type=${c.type} parts=`, c.message?.parts);
      });
      // 라운드트립되는 누적 state (이전 메시지들)
      console.log("[→ backend] state.messages:", (body as any).state?.messages);
      return body;
    },
    onResponse: () => {
      console.log("Response received from server");
    },
    onFinish: () => {
      console.log("Conversation completed");
    },
    onError: (error: Error) => {
      console.error("Assistant transport error:", error);
    },
    onCancel: () => {
      console.log("Request cancelled");
    },
  });
  const aui = useAui({
    tools: Tools({ toolkit }),
  });

  return (
    <AssistantRuntimeProvider aui={aui} runtime={runtime}>
      <DevToolsModal plugins={[stateTab]} />
      {children}
    </AssistantRuntimeProvider>
  );
}
