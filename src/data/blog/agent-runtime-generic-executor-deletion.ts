// The figure in /blog/agent-runtime-generic-executor-deletion, drawn from one recorded production run of
// src/examples/fleets/cancel-on-cap.mts (fleet_fe09ee4aad654a5db78ab110, 31 Oct 2026, exit 0, sandbox 1.0.146).
// The caps are the values the script set; the spend is the fleet's own spend() figure the script printed.
import { metricBars, type Figure, type Refusal } from '@tangle-network/charts';

const RUN = 'https://tangle.tools/?example=fleets%2Fcancel-on-cap#quickstart-title';

const usd = (value: number) => `$${value.toFixed(2)}`;

export const fleetCap = ((figure: Figure | Refusal) =>
  'refused' in figure
    ? figure
    : {
        ...figure,
        status: 'measured' as const,
        period: '31 Oct 2026, one fleet run',
        unit: 'US dollars, as reported by fleet.spend()',
        note: {
          ...figure.note,
          method:
            'One production run of the cancel-on-cap example on 31 Oct 2026 (sandbox SDK 1.0.146): six Claude Code agents, ' +
            'one dedicated sandbox each, the fleet created with budgetUsd 5. The script polled fleet.spend() every 5 s and called ' +
            'fleet.cancel() once spentUsd reached the $1 soft cap; it printed "$1.01 spent", with 2 agents completed and 4 cancelled. ' +
            'The run receipt reports $1.0103 for the run. At the stopping poll, fleet.spend() also reported $1.10 in flight and $2.89 remaining. ' +
            'The hard cap was never reached, so this run says nothing about how far the hard cap overshoots. The soft-cap overshoot ' +
            'depends on the poll interval, the number of agents and the model price; this is one sample.',
        },
        sources: [
          { label: 'Measurement notes', href: '#note-1' },
          { label: 'The recorded run', href: RUN },
        ],
      })(
  metricBars(
    [
      { id: 'soft', label: 'Soft cap, polled every 5 s', value: 1, detail: 'set by the script' },
      { id: 'spent', label: 'Spent when the fleet stopped', value: 1.0103, detail: '2 completed, 4 cancelled' },
      { id: 'hard', label: 'Hard cap the Platform enforces', value: 5, detail: 'budgetUsd; never reached' },
    ],
    { measure: 'fleet spend and its caps', unit: '', domain: [0, 5.5], formatValue: usd, width: 720, id: 'runtime-fleet-cap' },
  ),
);

export const runtimeOrLoopFigures = [fleetCap];
