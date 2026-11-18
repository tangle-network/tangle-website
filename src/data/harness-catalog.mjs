// Every harness, its recorded session and the CLI recordings: agent-container's catalog, served by Sandbox.
// The build mirrors the recordings under /harness-casts/ (astro.config.mjs) so the replay reads them from this origin.
const local = (url) => `/harness-casts/${url.split('/').pop()}`;

export async function loadCatalog() {
  const response = await fetch('https://sandbox.tangle.tools/harnesses.json');
  if (!response.ok) throw new Error(`Harness catalog returned ${response.status}`);
  const source = await response.json();
  const casts = [...source.harnesses.flatMap((h) => (h.capture?.ok ? [h.capture.url] : [])), ...source.cli.map((c) => c.cast)];
  const catalog = {
    ...source,
    harnesses: source.harnesses.map((h) => (h.capture?.ok ? { ...h, capture: { ...h.capture, url: local(h.capture.url) } } : h)),
    cli: source.cli.map((c) => ({ ...c, cast: local(c.cast) })),
  };
  return { catalog, casts };
}
