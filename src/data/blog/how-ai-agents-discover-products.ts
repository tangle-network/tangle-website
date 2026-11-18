// The figures in /blog/how-ai-agents-discover-products.
// Figure 1 is our own run: six coding agents in fresh Tangle sandboxes, one task, counted per run.
// Figure 2 is Evil Martians' two months of agent traffic on their own site, evilmartians.com, copied from their post.
// Figure 3 is Vercel's reported share of new signups referred by ChatGPT, copied from their post.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

type Provenance = {
  status: 'measured' | 'captured' | 'illustrative';
  period: string;
  unit: string;
  source: { label: string; href: string };
  method: string;
};

const provenance = (figure: Figure | Refusal, n: number, p: Provenance) =>
  'refused' in figure
    ? figure
    : { ...figure, status: p.status, period: p.period, unit: p.unit, note: { ...figure.note, method: p.method },
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, p.source] };

const runs = (count: number) => ({ count, label: count === 1 ? 'run' : 'runs' });

/** What six coding agents did when asked to add a Tangle Router client to an empty Node project. */
export const sixAgents = provenance(metricBars([
  { id: 'found-in-box', label: 'Found the Router in its own box', value: 6, observations: runs(6),
    detail: 'settings or environment (5), preinstalled packages (1)' },
  { id: 'hand-wrote', label: 'Hand-wrote an OpenAI-compatible client', value: 4, observations: runs(6),
    detail: 'no dependency; tests stub fetch' },
  { id: 'working', label: 'Finished with a working client', value: 4, observations: runs(6) },
  { id: 'budget-burned', label: 'Used the whole budget, mostly on internal packages', value: 2, observations: runs(6),
    detail: 'read the CLI packages in the image' },
  { id: 'made-up-key', label: 'Sent a request with a made-up credential', value: 2, observations: runs(6),
    detail: 'refused by the Router, no inference ran' },
  { id: 'read-llms', label: 'Fetched llms.txt or agent-setup.md', value: 0, observations: runs(6) },
  { id: 'installed', label: 'Installed our package, or any package', value: 0, observations: runs(6) },
], { measure: 'runs, out of six', unit: '', domain: [0, 6], formatValue: String, width: 720, id: 'six-agents-discovery' }), 1, {
  status: 'measured',
  period: '18 Nov 2026, 00:08 to 00:14 UTC',
  unit: 'agent runs (six in total)',
  source: { label: 'How we tested', href: '#how-we-tested' },
  method: 'Six fresh Tangle sandboxes, one agent each: Claude Code three times and Codex three times, all on ' +
    'deepseek/deepseek-v4.1-flash through Tangle Router (served model confirmed by a non-streaming probe of the served-model header). ' +
    'The Router does not serve Anthropic models for our internal work, so Claude Code ran on DeepSeek. ' +
    'Task, the same for all six: "Add a client for Tangle\'s model router to this Node project. Do not send any authenticated request." ' +
    'Each box started with an empty npm init -y project. Cap: 40 tool calls per run. ' +
    'Each box carried its own scoped child Router key, and the coding agents\' own configuration files and environment already named ' +
    'https://router.tangle.tools, so this was neither a credential-free box nor a cold start. ' +
    'Counted once per run. One model, one prompt, one product; it does not measure answer engines.',
});

/** Agent requests by format on evilmartians.com, crawlers excluded. */
export const readsByFormat = provenance(metricBars([
  { id: 'markdown', label: 'Markdown pages', value: 34_342 },
  { id: 'claude-code-md', label: 'Markdown pages, Claude Code only', value: 32_124, detail: '94% of Markdown reads' },
  { id: 'html', label: 'HTML pages', value: 27_200, detail: 'as reported, rounded' },
  { id: 'llms', label: 'llms.txt and llms-full.txt', value: 170, detail: '0.3% of agent reads' },
], { measure: 'agent requests', unit: '', domain: [0, 40_000], formatValue: (v) => v.toLocaleString('en-US'), width: 720,
  id: 'agent-reads-by-format' }), 2, {
  status: 'captured',
  period: 'Sep to Oct 2026 (post updated Oct 2026)',
  unit: 'HTTP requests from AI agents acting for a person',
  source: { label: 'Evil Martians: Which AI actually reads your site?', href: 'https://evilmartians.com/chronicles/which-ai-actually-reads-your-site-two-months-of-llm-traffic-measured' },
  method: 'Copied from Evil Martians\' post, read 17 Nov 2026. One site (evilmartians.com), crawlers ' +
    'excluded. The post gives Markdown as 34,342 reads in its Claude Code breakdown (34,300 rounded elsewhere) and HTML as 27,200. ' +
    'The Claude Code bar is a subset of the Markdown bar. Coding agents as a group took Markdown on 88% of their requests ' +
    '(Claude Code 88%, OpenCode 93%, GitHub Copilot 100%); chat assistants on 0.9%, and ChatGPT\'s fetcher on 0.7%. ' +
    'Without Claude Code, the other named agents fetched Markdown 6% of the time. One site; not a sample of the web.',
});

/** Share of Vercel's new signups referred by ChatGPT, as Vercel reported it. */
export const vercelSignups = provenance(metricBars([
  { id: 'six-months', label: 'Six months before', value: 1 },
  { id: 'prior-month', label: 'Month before', value: 4.8 },
  { id: 'at-post', label: 'Latest reported', value: 10, detail: '"around 10%"' },
], { measure: 'share of new signups referred by ChatGPT', unit: '%', domain: [0, 12], formatValue: (v) => `${v}%`, width: 720,
  id: 'vercel-chatgpt-signups' }), 3, {
  status: 'captured',
  period: 'As reported by Vercel, 10 Jun 2025',
  unit: 'percent of new Vercel signups',
  source: { label: 'Vercel: How we\'re adapting SEO for LLMs and AI search', href: 'https://vercel.com/blog/how-were-adapting-seo-for-llms-and-ai-search' },
  method: 'Copied from Vercel\'s post of 10 Jun 2025, read 17 Nov 2026: "ChatGPT now refers around 10% of new Vercel signups. ' +
    'That\'s up from 4.8% the previous month, and 1% six months ago." Vendor-reported. ' +
    'It is a June 2025 figure, not a current one.',
});

export const discoveryFigures = [sixAgents, readsByFormat, vercelSignups];
