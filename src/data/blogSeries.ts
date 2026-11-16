import { getCollection, type CollectionEntry } from 'astro:content'
import details from './blogSeries.json'

export interface BlogSeriesDetails {
  title: string
  description: string
  premise: string
  decision?: string
  path?: string
}

export type BlogPost = CollectionEntry<'blog'>

export interface BlogSeries {
  name: string
  slug: string
  title: string
  details?: BlogSeriesDetails
  /** Every post in the series is about the Tangle Network protocol. */
  network: boolean
  posts: BlogPost[]
  latest: string
}

export const blogSeriesDetails: Record<string, BlogSeriesDetails> = details

/** The series /blog pins first and links as the place to start. */
export const introSeriesSlug = 'introduction-to-tangle'

export const isNetworkPost = (post: BlogPost) => post.data.section === 'network'

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

const seriesName = (post: BlogPost) => post.data.series?.replace(/^['"]|['"]$/g, '') || ''
const inOrder = (a: BlogPost, b: BlogPost) =>
  (a.data.seriesOrder ?? 999) - (b.data.seriesOrder ?? 999) || b.data.date.localeCompare(a.data.date)
export const newestFirst = (a: BlogPost, b: BlogPost) => b.data.date.localeCompare(a.data.date)

/**
 * Every published post, grouped into series. A series lists only its agent posts; a series whose posts are all
 * network posts is a network series. A network post inside an agent series belongs to no series and is listed
 * on /blog/network/ on its own.
 */
export async function getBlog() {
  const posts = await getCollection('blog', ({ data }) => !data.draft)
  const grouped = new Map<string, BlogPost[]>()
  for (const post of posts) {
    const name = seriesName(post)
    if (!name) continue
    if (!grouped.has(name)) grouped.set(name, [])
    grouped.get(name)!.push(post)
  }
  const series: BlogSeries[] = [...grouped.entries()].map(([name, entries]) => {
    const agent = entries.filter((post) => !isNetworkPost(post))
    const listed = (agent.length ? agent : entries).sort(inOrder)
    const seriesDetails = getBlogSeriesDetails(name)
    return {
      name,
      slug: blogSeriesSlug(name),
      title: seriesDetails?.title ?? name,
      details: seriesDetails,
      network: agent.length === 0,
      posts: listed,
      latest: listed.reduce((m, p) => (p.data.date > m ? p.data.date : m), ''),
    }
  })
  const seriesOf = (post: BlogPost) => series.find((s) => s.posts.includes(post))
  const standalone = posts.filter((post) => !seriesOf(post)).sort(newestFirst)
  return { posts, series, seriesOf, standalone }
}
