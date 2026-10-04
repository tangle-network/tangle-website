import { AgentTimeline, type AgentTimelineItem } from '@tangle-network/ui/chat';
import { CodeBlock } from '@tangle-network/ui/markdown';
import type { ToolCallData } from '@tangle-network/ui/run';
import { useEffect, useRef, useState } from 'react';
import run from '../data/homepageRun.json';
import './recorded-agent-timeline.css';

const PROGRESS_EVENT = 'tangle:run-progress';
const RECEIPT_SHA256 = '0503e09c5bd363bd06649e501eeadf81742d7791a82dbf0e1064e0f744ce7ae3';

// Each tool returned a completed part in this receipt, including the failing test pipeline.
const RECORDED_TOOLS = [
  { id: 'toolu_011dCSS7ThjhKYGSVSSbKSth', type: 'bash', duration: 150 },
  { id: 'toolu_017XRLo4GWjpmMKo9iSWCR9g', type: 'read', duration: 41 },
  { id: 'toolu_01GUKY7hz5UAG3ooGpETwk9Q', type: 'read', duration: 27 },
  { id: 'toolu_01FWFjjT6hJ66CUfEVBPW5p7', type: 'bash', duration: 434 },
  { id: 'toolu_01TCoMt5e9xKivAeeEJ2mPuq', type: 'edit', duration: 89 },
  { id: 'toolu_01CiMV89nUFj9h2xKq459Mpn', type: 'bash', duration: 296 },
] satisfies Pick<ToolCallData, 'id' | 'type' | 'duration'>[];

if (run.source.sha256 !== RECEIPT_SHA256) {
  throw new Error('The recorded timeline requires tool states from its matching receipt.');
}

let toolIndex = 0;
const EVENT_ITEMS = run.events.map((event, index): AgentTimelineItem[] => {
  if (event.kind === 'assistant') {
    return [{ id: `assistant-${index}`, kind: 'message', role: 'assistant', content: event.text }];
  }

  const tool = RECORDED_TOOLS[toolIndex++];
  if (!tool || event.kind !== tool.type || event.durationMs !== tool.duration || !event.output) {
    throw new Error(`Recorded tool ${index} does not match the verified receipt.`);
  }

  const call: ToolCallData = {
    ...tool,
    label: event.label,
    detail: event.text,
    output: event.output,
    status: 'success',
  };
  const failedTests = /^# fail [1-9]\d*$/m.test(event.output);

  return [
    { id: tool.id, kind: 'tool', call },
    {
      id: `${tool.id}-output`,
      kind: 'custom',
      // The static showcase keeps the captured output visible without opening a tool control.
      content: <CodeBlock code={event.output} label="" language={event.kind === 'bash' ? 'text' : 'typescript'}
        className={`recorded-tool-output${failedTests ? ' recorded-tool-output--failed-tests' : ''}`} />,
    },
  ];
});

if (toolIndex !== RECORDED_TOOLS.length) {
  throw new Error('The recorded timeline is missing a verified tool result.');
}

const PROMPT: AgentTimelineItem = { id: 'recorded-prompt', kind: 'message', role: 'user', content: run.prompt };

export default function RecordedAgentTimeline() {
  const [progress, setProgress] = useState(1);
  const latestProgress = useRef(1);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setProgress(reducedMotion.matches ? 1 : latestProgress.current);
    const receiveProgress = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail?.progress !== 'number' ||
          !Number.isFinite(event.detail.progress)) return;
      latestProgress.current = Math.min(1, Math.max(0, event.detail.progress));
      updateMotion();
    };

    window.addEventListener(PROGRESS_EVENT, receiveProgress);
    reducedMotion.addEventListener('change', updateMotion);
    updateMotion();
    // The parent can resend its current scroll position after this island hydrates.
    window.dispatchEvent(new Event('tangle:run-ready'));
    return () => {
      window.removeEventListener(PROGRESS_EVENT, receiveProgress);
      reducedMotion.removeEventListener('change', updateMotion);
    };
  }, []);

  // Reveal in captured source order; this does not assign times to untimed assistant excerpts.
  const visibleEvents = Math.floor(progress * EVENT_ITEMS.length);
  const items = [PROMPT, ...EVENT_ITEMS.slice(0, visibleEvents).flat()];

  return <AgentTimeline items={items} className="recorded-agent-timeline" />;
}
