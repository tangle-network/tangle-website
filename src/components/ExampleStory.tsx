import { CodeBlock, CopyButton } from '@tangle-network/ui/markdown';
import { Button } from '@tangle-network/ui/primitives';
import { formatDate } from '../utils/date';
import './example-story.css';

interface Props {
  source: string;
  excerpt: string;
  recordUrl: string;
  recordedAt: string;
  before: string;
  after: string;
  patch: string;
  variant: 'paired' | 'change' | 'sequence';
}

export default function ExampleStory({ source, excerpt, recordUrl, recordedAt, before, after, patch, variant }: Props) {
  const operation = <CodeBlock className="es-code es-operation" code={excerpt} language="ts" label="" />;
  const failure = <CodeBlock className="es-code es-before" code={before} language="text" label="" />;
  const success = <CodeBlock className="es-code es-after" code={after} language="text" label="" />;
  const changes = <CodeBlock className="es-code es-patch" code={patch} language="diff" label="" />;
  const download = <Button variant="ghost" size="lg" asChild><a download="fix-a-test.patch" href={`data:text/plain;charset=utf-8,${encodeURIComponent(patch)}`}>Download patch</a></Button>;

  return <div className={`es-story es-${variant}`}>
    {variant === 'paired' && <div className="es-pair">
      {operation}
      <div className="es-tests">{failure}{success}</div>
    </div>}
    {variant === 'change' && <div className="es-change-reading">
      <div className="es-verdict">{failure}{success}</div>
      {operation}
      {changes}
    </div>}
    {variant === 'sequence' && <div className="es-sequence-reading">{failure}{operation}{success}</div>}
    <div className="es-actions">
      <details>
        <summary>Get full example</summary>
        <div className="es-copy"><CopyButton text={source} label="Copy file" /></div>
        <CodeBlock className="es-code" code={source} language="ts" label="" />
      </details>
      {variant === 'change' ? download : <details>
        <summary>View patch</summary>
        {changes}
        {download}
      </details>}
    </div>
    <a className="es-record" href={recordUrl}>Recorded <time dateTime={recordedAt}>{formatDate(recordedAt.slice(0, 10), 'short')}</time></a>
  </div>;
}
