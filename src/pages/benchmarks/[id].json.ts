import type { APIRoute } from 'astro';
import { boards, boardSource } from '../../data/benchmarks/index';

// Each board's record, served as the committed file so its bytes are the ones
// the verifier checked at build time.
export function getStaticPaths() {
  return boards.map((board) => ({ params: { id: board.suite.id } }));
}

export const GET: APIRoute = ({ params }) => new Response(boardSource(params.id!), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
