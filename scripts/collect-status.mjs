import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const outputPath = new URL('../public/status/history.json', import.meta.url);
const windowDays = 90;
const timeoutMs = 12_000;

const services = JSON.parse(await readFile(new URL('../src/data/status-services.json', import.meta.url), 'utf8'));

const todayIso = () => new Date().toISOString().slice(0, 10);

const statusForDay = (ok, checks) => {
  if (checks === 0) return 'unknown';
  if (ok === checks) return 'operational';
  if (ok > 0) return 'degraded';
  return 'down';
};

const readExisting = async () => {
  try {
    return JSON.parse(await readFile(outputPath, 'utf8'));
  } catch {
    return { version: 1, windowDays, generatedAt: null, services: [], incidents: [] };
  }
};

const checkService = async (service) => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(service.checkUrl, {
      method: 'GET',
      headers: { accept: 'application/json,text/html;q=0.9,*/*;q=0.8' },
      cache: 'no-store',
      signal: controller.signal,
    });

    let ok = response.ok;
    let reason;
    if (ok && service.jsonStatusField) {
      // A 2xx JSON health check fails on its status field; record the value and any false `checks` entries.
      const body = await response.json().catch(() => null);
      const value = body?.[service.jsonStatusField];
      ok = value === service.jsonStatusValue;
      const failing = Object.keys(body?.checks ?? {}).filter((name) => body.checks[name] === false);
      if (!ok) reason = body ? `${service.jsonStatusField}: ${value}${failing.length ? ` (${failing.join(', ')} failing)` : ''}` : 'body is not JSON';
    }

    return {
      ok,
      status: ok ? 'operational' : 'down',
      httpStatus: response.status,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      ...(reason && { reason }),
    };
  } catch (error) {
    return {
      ok: false,
      status: 'down',
      httpStatus: null,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      reason: error?.name === 'AbortError' ? 'timeout' : 'network error',
    };
  } finally {
    clearTimeout(timeout);
  }
};

const mergeResult = (history, result) => {
  const date = todayIso();
  const existingDay = history.find((day) => day.date === date);
  const day = existingDay ?? { date, checks: 0, ok: 0, status: 'unknown', samples: [] };

  day.checks += 1;
  if (result.ok) day.ok += 1;
  day.status = statusForDay(day.ok, day.checks);
  day.uptimePct = Number(((day.ok / day.checks) * 100).toFixed(2));
  day.lastCheckedAt = result.checkedAt;
  day.lastLatencyMs = result.latencyMs;
  day.lastHttpStatus = result.httpStatus;
  day.samples = [...(day.samples ?? []), result].slice(-24);

  const withoutToday = history.filter((entry) => entry.date !== date);
  return [...withoutToday, day]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-windowDays);
};

const existing = await readExisting();
const previousById = new Map((existing.services ?? []).map((service) => [service.id, service]));

const checked = [];
for (const service of services) {
  const result = await checkService(service);
  const previous = previousById.get(service.id);
  checked.push({
    id: service.id,
    name: service.name,
    domain: service.domain,
    href: service.href,
    checkUrl: service.checkUrl,
    description: service.description,
    current: result,
    history: mergeResult(previous?.history ?? [], result),
  });
}

const payload = {
  version: 1,
  windowDays,
  generatedAt: new Date().toISOString(),
  services: checked,
  incidents: existing.incidents ?? [],
};

await mkdir(dirname(outputPath.pathname), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

for (const service of checked) {
  const current = service.current;
  console.log(`${current.ok ? 'ok' : 'down'}\t${service.domain}\t${current.httpStatus ?? '-'}\t${current.latencyMs}ms`);
}
