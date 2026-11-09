/** A replay's clock, m:ss, and the length of a stretch it skipped. */
export const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
export const elapsed = (ms: number) => { const s = Math.round(ms / 1000), m = Math.round(s / 60); return s < 60 ? `${s} s` : m < 60 ? `${m} min` : `${+(m / 60).toFixed(1)} h`; };

export function formatDate(value: string, month: 'short' | 'long' = 'long') {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  })
}
