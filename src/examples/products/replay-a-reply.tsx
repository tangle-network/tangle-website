import { useEffect, useState } from "react";
import { streamChatTurn } from "@tangle-network/agent-app/web-react";

// Use a turn ID from a signed-in conversation in the Agent App chat starter.
export function ReplayReply({ turnId }: { turnId: string }) {
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    const read = (id: string, fromSeq: number) => fetch(
      `/api/chat/replay/${encodeURIComponent(id)}?fromSeq=${fromSeq}`,
      { signal: abort.signal },
    );
    setReply("");
    setError("");
    void streamChatTurn({
      start: () => read(turnId, 0),
      resume: read,
      onResetForResume: () => { if (!abort.signal.aborted) setReply(""); },
      callbacks: {
        onText: text => { if (!abort.signal.aborted) setReply(reply => reply + text); },
        onErrorEvent: message => { if (!abort.signal.aborted) setError(message); },
      },
    }).catch(cause => { if (!abort.signal.aborted) setError(String(cause)); });
    return () => abort.abort();
  }, [turnId]);

  return <><p>{reply}</p>{error && <p role="alert">{error}</p>}</>;
}
