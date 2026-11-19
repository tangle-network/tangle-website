const url = "https://router.tangle.tools/api/models/liveness?verdict=serving";
const response = await fetch(url);
if (!response.ok) throw new Error(`Router returned ${response.status}`);

const { data }: { data: { model: string; stale: boolean }[] } = await response.json();
for (const entry of data) {
  if (!entry.stale) console.log(entry.model);
}
