// The figures in /blog/agent-readiness-index-methodology. Figure 1 is copied from the abstracts of Mastouri et al.,
// arXiv 2507.16044, versions 3 and 4. Nothing here is our measurement, and nothing is rounded beyond what the paper reports.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

type Provenance = {
  status: 'measured' | 'captured' | 'illustrative';
  period: string;
  unit: string;
  sources: { label: string; href: string }[];
  method: string;
};

const provenance = (figure: Figure | Refusal, n: number, p: Provenance) =>
  'refused' in figure
    ? figure
    : {
        ...figure,
        status: p.status,
        period: p.period,
        unit: p.unit,
        note: { ...figure.note, method: p.method },
        sources: [{ label: 'Measurement notes', href: `#note-${n}` }, ...p.sources],
      };

const V3 = 'https://arxiv.org/abs/2507.16044v3';
const V4 = 'https://arxiv.org/abs/2507.16044v4';

/** Share of generated MCP tools that worked, before and after the spec was repaired, in each version of the study. */
export const openApiToMcp = provenance(
  metricBars(
    [
      { id: 'v3-raw', label: 'v3, as generated', value: 76.5, detail: '50 APIs, 1,023 sampled calls' },
      { id: 'v3-fixed', label: 'v3, after manual spec fixes', value: 99.9, detail: 'about 19 lines per API, by hand' },
      { id: 'v4-raw', label: 'v4, as generated', value: 76, detail: '80 OpenAPI contracts' },
      { id: 'v4-repaired', label: 'v4, after automated repair', value: 94.2, detail: 'automated repair step' },
    ],
    {
      measure: 'generated MCP calls (v3) or tools (v4) that worked',
      unit: '',
      domain: [0, 100],
      formatValue: (value) => `${value}%`,
      width: 720,
      id: 'openapi-to-mcp-success',
    },
  ),
  1,
  {
    status: 'captured',
    period: 'arXiv 2507.16044 v3 (10 Sep 2025) and v4 (6 Apr 2026)',
    unit: 'percent of sampled tool calls (v3) or sampled tools (v4) that succeeded',
    sources: [
      { label: 'Mastouri et al., v3: Making REST APIs Agent-Ready', href: V3 },
      { label: 'Mastouri et al., v4: From REST to MCP', href: V4 },
    ],
    method:
      'Copied from the paper abstracts, not measured by us. v3 generated MCP servers from 50 real OpenAPI 2.0/3.0 specs ' +
      '(5,066 endpoints) and sampled 1,023 tool calls; 76.5% succeeded out of the box. The authors traced every failure to ' +
      'omissions or inconsistencies in the spec, then fixed the specs by hand (about 19 changed lines per API on average) and ' +
      'reached 99.9%. v4 is a larger study of 80 OpenAPI contracts: baseline generation succeeded for 76% of sampled tools and ' +
      'an automated repair step raised that to 94.2%. The two versions sample different APIs and count different units (calls ' +
      'versus tools), so read each pair on its own; do not compare v3 bars with v4 bars. The success rates measure whether a generated ' +
      'tool could be called correctly, not whether an agent completed a user task with it.',
  },
);

export const agentReadyApiFigures = [openApiToMcp];
