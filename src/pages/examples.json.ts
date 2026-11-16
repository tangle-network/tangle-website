import type { APIRoute } from 'astro';
import { initialExample, subjects } from '../data/examples';

// The example editor's subjects, with absolute run-record URLs, for sandbox.tangle.tools: it renders the same
// @tangle-network/ui/marketing ExampleEditor and fetches this file (Pages serves every path with Access-Control-Allow-Origin: *).
// The permanent contract between the sites: this repository owns the examples, their recorded runs and the recorder.
export const GET: APIRoute = ({ site }) => Response.json({
  initial: initialExample,
  subjects: subjects.map((subject) => ({
    ...subject,
    ideas: subject.ideas.map((idea) => (idea.run ? { ...idea, run: { ...idea.run, url: new URL(idea.run.url, site).href } } : idea)),
  })),
});
