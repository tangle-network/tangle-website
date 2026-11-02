import details from './blogSeries.json'

export interface BlogSeriesDetails {
  title: string
  description: string
  premise: string
  decision: string
  path?: string
  startHere: {
    title: string
    slug: string
  }
}

export const blogSeriesDetails: Record<string, BlogSeriesDetails> = details

export function blogSeriesSlug(series: string) {
  return series
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getBlogSeriesDetails(series: string) {
  return blogSeriesDetails[blogSeriesSlug(series)]
}
