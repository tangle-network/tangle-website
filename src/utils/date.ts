export function formatDate(value: string, month: 'short' | 'long' = 'long') {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  })
}
