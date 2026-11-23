import type { APIRoute } from 'astro';
import { initialExample, featuredExamples, subjects, budget } from '../data/examples';

// The example editor's subjects, with absolute run-record URLs, for sandbox.tangle.tools: it renders the same
// @tangle-network/ui/marketing ExampleEditor and fetches this file (Pages serves every path with Access-Control-Allow-Origin: *).
// The permanent contract between the sites: this repository owns the examples, their recorded runs and the recorder.
export const GET: APIRoute = ({ site }) => {
  const publicSubject = (subject: typeof subjects[number]) => ({
    ...subject,
    ideas: subject.ideas.map((idea) => {
      if (!idea.run) return idea;
      const { events, ...run } = idea.run;
      return { ...idea, run: { ...run, url: new URL(run.url, site).href } };
    }),
  });
  return Response.json({ initial: initialExample, featured: featuredExamples,
    subjects: subjects.map(publicSubject), budget: budget.map(publicSubject) });
};
