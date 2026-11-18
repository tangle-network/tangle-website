// A post's social card: its hero art at 1200 x 630 with the Brand knot, rasterized at build time.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { knotSvg } from '@tangle-network/brand/knot';
import { renderHero, type Hero } from '@tangle-network/charts';
import sharp from 'sharp';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft && Boolean(data.hero));
  return posts.map((post) => ({ params: { slug: post.data.slug }, props: { hero: post.data.hero } }));
};

export const GET: APIRoute = async ({ props }) => {
  const svg = renderHero(props.hero as Hero, { id: 'og', frame: 'og', mark: knotSvg({ id: 'og-knot', size: 56 }) });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
