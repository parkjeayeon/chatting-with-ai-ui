"use client";

import {
  AssistantRuntimeProvider,
  Tools,
  type AssistantTransportConnectionMetadata,
  unstable_createMessageConverter as createMessageConverter,
  useAui,
  useAssistantTransportRuntime,
  SimpleImageAttachmentAdapter,
  CompositeAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { convertLangChainMessages, type LangChainMessage } from "@assistant-ui/react-langgraph";
import type { ReactNode } from "react";
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

type State = {
  messages: LangChainMessage[];
};

const LangChainMessageConverter = createMessageConverter(convertLangChainMessages);

const converter = (state: State, connectionMetadata: AssistantTransportConnectionMetadata) => {
  const optimisticStateMessages = connectionMetadata.pendingCommands.map(
    (c): LangChainMessage[] => {
      if (c.type === "add-message") {
        return [
          {
            type: "human" as const,
            content: [
              {
                type: "text" as const,
                text: c.message.parts.map((p) => (p.type === "text" ? p.text : "")).join("\n"),
              },
            ],
          },
        ];
      }
      return [];
    },
  );

  const messages = [...state.messages, ...optimisticStateMessages.flat()];
  return {
    messages: LangChainMessageConverter.toThreadMessages(messages),
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
      ]),
    },
    body: {
      "Test-Body": "test-value",
    },
    prepareSendCommandsRequest: (body) => {
      console.log("Assistant transport request tools:", body.tools);
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
