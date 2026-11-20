import {
  ChatComposer, ChatMessages, useChatScroll,
  type ChatComposerProps, type ChatUiMessage,
} from "@tangle-network/agent-app/web-react";

// In the chat starter, pass messages, busy and send from Conversation.tsx.
export function AgentChat({ messages, busy, send }: {
  messages: ChatUiMessage[];
  busy: boolean;
  send: NonNullable<ChatComposerProps["onSendParts"]>;
}) {
  const scroll = useChatScroll();

  return (
    <>
      <div ref={scroll.viewportRef} role="region" aria-label="Conversation"
        tabIndex={0} style={{ height: "24rem", overflowY: "auto" }}>
        <div ref={scroll.contentRef}>
          <ChatMessages messages={messages} loading={busy} />
        </div>
      </div>
      <ChatComposer onSendParts={send} sendDisabled={busy} placeholder="Ask your agent…" />
    </>
  );
}
