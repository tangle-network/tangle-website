// Runs each home page example file for real and records what it did, so the editor's Play replays a real run.
//
//   record:  dotenvx get US_SANDBOX_PRODUCTION_API_KEY -f <vault> | node scripts/record-examples.mts [subject/idea ...]
//   session: <a key whose allow-list has the session's model> | node scripts/record-examples.mts --session <name>
//   check:   node scripts/record-examples.mts --check   (pnpm check:runs)
//
// Every example needs a fresh, matching, successful run except the files NO_RUN lists with their reason; check mode
// prints that list, and a listed file with a record fails the gate so the list only shrinks.
//
// The key arrives on stdin and reaches each example only as TANGLE_API_KEY; it is never printed or written.
// Each example runs byte for byte from a copy beside scripts/examples-typecheck/node_modules, under this same
// file as an --import preload that wraps the SDK's methods, fetch and stdout. Every call carries the example
// line it came from (V8 stack), so the replay lights the line that fired it; check mode verifies that the line
// names the call, the source sha256 (comments and blank lines excluded) matches, the run exited 0 and the record is under 30 days old.
//
// A session (scripts/sessions/<name>.sh) is a terminal: each line is a command typed into a shell, recorded with what it
// printed. Its `tangle` commands run under the same preload, so the record also holds the agent stream the CLI read:
// every file the agent wrote and every command it ran. Check mode rebuilds the files from that stream and verifies each
// one against the bytes the session's preview URL served.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { sourceDigest } from "./example-digest.mjs";
import { plain, sessionFiles } from "../src/utils/session.mjs";
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { hostname, tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = join(ROOT, "src/examples");
const RUNS = join(ROOT, "src/data/runs");
const HARNESS = join(ROOT, "scripts/examples-typecheck");
const SESSIONS = join(ROOT, "scripts/sessions");
const SESSION_RUNS = join(ROOT, "src/data/sessions");
const MAX_AGE_DAYS = 30;
// Examples with no recorded run, and why. Record mode skips them; the page shows "No live run yet" for them.
const NO_RUN: Record<string, string> = {
  "router/security-model": "requires a customer-selected, key-restricted model; no live run recorded",
  "router/review-a-route": "requires a customer-selected Router model; no live run recorded",
  "runtime/any-cloud-e2b": "no credential in vault",
  "runtime/any-cloud-daytona": "no credential in vault",
  "runtime/any-cloud-computesdk": "no credential in vault",
};
// A call that threw, or returned the SDK's { success: false } turn, failed the run even when the process exited 0.
const failed = (e: Event) => e.kind === "call" && (e.error !== undefined || (e.result as { success?: boolean } | undefined)?.success === false);
const examples = () => readdirSync(EXAMPLES).flatMap((subject) =>
  readdirSync(join(EXAMPLES, subject)).filter((f) => f.endsWith(".mts")).map((f) => `${subject}/${f.slice(0, -4)}`));

type Event = { atMs: number; kind: string; id?: number; parent?: number | null; line?: number; name?: string; [key: string]: unknown };
type RunRecord = { source: { path: string; sha256: string }; run: Record<string, unknown> & { recordedAt: string; exitCode: number }; events: Event[] };

// ---------------------------------------------------------------------------------------------------------------
// Preload: instrument one example process.
async function instrument(out: string, file: string) {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  const fileUrl = pathToFileURL(file).href;
  const self = import.meta.url;
  const t0 = performance.now();
  // A session's commands share the recorder's clock and keep whole file contents; the recorder reads their output itself.
  const session = Number(process.env.TANGLE_RECORD_T0) || 0;
  const [TEXT, DEPTH] = session ? [Infinity, 8] : [4000, 4];
  const als = new AsyncLocalStorage<{ id: number; streaming: boolean }>();
  let nextId = 1;
  const emit = (event: Omit<Event, "atMs">) =>
    appendFileSync(out, JSON.stringify({ atMs: session ? Date.now() - session : Math.round(performance.now() - t0), ...event }) + "\n");
  Error.stackTraceLimit = 80;

  // Credential-shaped keys and live handles; token counts (inputTokens, prompt_tokens) stay.
  const HIDDEN = /api_?key|secret|password|authorization|cookie|^(token|\w+Token|bearer)$|^_|^(client|http|signal|controller|fetch)$/i;
  const snap = (value: unknown, depth = 0, seen = new WeakSet<object>()): unknown => {
    if (value === null || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "string") return value.length > TEXT ? `${value.slice(0, TEXT)}… (${value.length} chars)` : value;
    if (typeof value !== "object") return undefined;
    if (value instanceof Error) return { error: value.name, message: value.message };
    if (seen.has(value) || depth > DEPTH) return "…";
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, 40).map((item) => snap(item, depth + 1, seen));
    if (typeof (value as { then?: unknown }).then === "function" || value instanceof AbortSignal) return undefined;
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (HIDDEN.test(key)) continue;
      const kept = snap(item, depth + 1, seen);
      if (kept !== undefined) copy[key] = kept;
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      for (const key of ["id", "status", "state", "name"]) {
        if (key in copy) continue;
        try {
          const field = (value as Record<string, unknown>)[key];
          if (typeof field === "string" || typeof field === "number") copy[key] = field;
        } catch { /* a getter that needs a live connection */ }
      }
    }
    return copy;
  };

  // The example line that started this call, and whether the example called it directly.
  const site = () => {
    const frames = (new Error().stack ?? "").split("\n").slice(2).filter((frame) => !frame.includes(self));
    const at = frames.find((frame) => frame.includes(fileUrl));
    if (!at) return null;
    const direct = frames.find((frame) => !frame.includes("node:internal"))?.includes(fileUrl) ?? false;
    return { line: Number(at.match(/:(\d+):\d+\)?$/)?.[1]), direct };
  };
  // Calls an SDK helper (openaiTools' handler) makes for the example: the sandbox work it delegates.
  const DELEGATED = new Set(["exec", "read", "write", "delete", "search", "list", "download", "upload", "runCode", "prompt"]);
  const patched = new WeakSet<object>();
  const isStream = (value: unknown): value is AsyncIterator<unknown> & AsyncIterable<unknown> =>
    !!value && typeof value === "object" && Symbol.asyncIterator in value && "next" in value;

  const stream = (iterator: AsyncIterator<unknown> & AsyncIterable<unknown>, id: number, own = false) => {
    const step = (method: "next" | "return" | "throw", arg?: unknown) => als.run({ id, streaming: true }, async () => {
      const item = await (iterator[method] as (value?: unknown) => Promise<IteratorResult<unknown>>).call(iterator, arg);
      // A call that returns its stream (streamPrompt) runs until the stream ends, so the line stays lit that long.
      if (item.done && own) emit({ kind: "return", id, result: "stream" });
      if (!item.done) {
        const value = item.value as { type?: unknown; data?: unknown } | undefined;
        emit({ kind: "stream", parent: id, type: String(value?.type ?? "value"), data: snap(value?.data ?? value) });
      }
      return item;
    });
    return {
      next: (arg?: unknown) => step("next", arg),
      return: (arg?: unknown) => step("return", arg),
      throw: (arg?: unknown) => step("throw", arg),
      [Symbol.asyncIterator]() { return this; },
    };
  };

  const wrap = (name: string, fn: (...args: unknown[]) => unknown) => function (this: unknown, ...args: unknown[]) {
    const where = site();
    const store = als.getStore();
    if (!where || (!where.direct && (store || !DELEGATED.has(name)))) {
      // An SDK method's own stream (prompt's streamPrompt, runAll's run) is recorded under the call that consumes it.
      const inner = fn.apply(this, args);
      return store && !store.streaming && isStream(inner) ? stream(inner, store.id) : inner;
    }
    const id = nextId++;
    emit({ kind: "call", id, parent: store?.id ?? null, line: where.line, name, ...(where.direct ? {} : { delegated: true }) });
    const settle = (value: unknown) => { emit({ kind: "return", id, result: snap(value) }); return instrumentValue(value); };
    const fail = (error: unknown) => { emit({ kind: "return", id, error: snap(error) }); throw error; };
    let result: unknown;
    try { result = als.run({ id, streaming: false }, () => fn.apply(this, args)); } catch (error) { fail(error); }
    if (isStream(result)) { emit({ kind: "return", id, result: "stream" }); return stream(result, id, true); }
    if (result instanceof Promise) return result.then(settle, fail);
    return settle(result);
  };

  const patchObject = (target: object) => {
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(target))) {
      if (/^(constructor|then|catch|finally|_.*)$/.test(key) || !descriptor.configurable) continue;
      if (typeof descriptor.value === "function") {
        Object.defineProperty(target, key, { ...descriptor, value: wrap(key, descriptor.value) });
      } else if (descriptor.get) {
        const get = descriptor.get;
        Object.defineProperty(target, key, { ...descriptor, get() { return instrumentValue(get.call(this)); } });
      }
    }
  };
  function instrumentValue<T>(value: T): T {
    if (Array.isArray(value)) { value.forEach(instrumentValue); return value; } // a listed sandbox's calls count too
    if (!value || typeof value !== "object") return value;
    let proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      if (!patched.has(value)) { patched.add(value); patchObject(value); }
      return value;
    }
    while (proto && proto !== Object.prototype && !patched.has(proto)) {
      patched.add(proto);
      patchObject(proto);
      proto = Object.getPrototypeOf(proto);
    }
    return value;
  }

  // agent-eval and agent-runtime hand the example plain objects from factories; route those imports through a wrapping shim.
  const FACTORIES: Record<string, string[]> = {
    "@tangle-network/agent-eval": ["defineAgentEval", "llmJudge"],
    "@tangle-network/agent-runtime/kernel": ["providerAsSandboxClient"],
  };
  const factories: Record<string, (...args: unknown[]) => unknown> = {};
  (globalThis as Record<string, unknown>).__tangleRecordFactory = (name: string, fn: (...args: unknown[]) => unknown) =>
    (factories[name] ??= (...args: unknown[]) => instrumentValue(fn(...args)));
  const { registerHooks } = await import("node:module");
  registerHooks({
    resolve(specifier, context, next) {
      const found = next(specifier, context);
      const names = Object.entries(FACTORIES).find(([prefix]) => specifier.startsWith(prefix))?.[1];
      if (context.parentURL !== fileUrl || !names) return found;
      const shim = `import * as m from ${JSON.stringify(found.url)}; export * from ${JSON.stringify(found.url)};\n` +
        names.map((n) => `export const ${n} = globalThis.__tangleRecordFactory("${n}", m.${n});`).join("\n");
      return { url: `data:text/javascript,${encodeURIComponent(shim)}`, shortCircuit: true };
    },
  });

  const require = createRequire(file);
  for (const entry of session ? ["@tangle-network/sandbox"] : ["@tangle-network/sandbox", "@tangle-network/sandbox/agent"]) {
    const sdk = await import(pathToFileURL(require.resolve(entry)).href);
    instrumentValue(Object.create(sdk.Sandbox.prototype));
  }
  if (session) return;

  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const where = site();
    if (!where?.direct || als.getStore()) return realFetch(input, init);
    const id = nextId++;
    emit({ kind: "call", id, parent: null, line: where.line, name: "fetch" });
    const response = await realFetch(input, init);
    const json = await response.clone().json().catch(() => undefined);
    const message = json?.choices?.[0]?.message;
    emit({ kind: "return", id, result: snap({ status: response.status, usage: json?.usage, content: message?.content,
      toolCalls: message?.tool_calls?.map((call: { function: { name: string; arguments: string } }) => ({ name: call.function.name, arguments: call.function.arguments })) }) });
    return response;
  };

  for (const stream of ["stdout", "stderr"] as const) {
    const write = process[stream].write.bind(process[stream]);
    process[stream].write = ((chunk: string | Uint8Array, ...rest: never[]) => {
      emit({ kind: stream, text: typeof chunk === "string" ? chunk : Buffer.from(chunk).toString() });
      return write(chunk, ...rest);
    }) as typeof process.stdout.write;
  }
  process.on("exit", (code) => emit({ kind: "exit", code }));
}

// ---------------------------------------------------------------------------------------------------------------
// Record: run each example and fold its events into src/data/runs/<subject>/<idea>.json.
const ASSIGN = /^\s*(?:(?:const|let)\s+)?(\w+|\{[^}]*\})\s*=\s*\(?await\b/;
const LABEL = (line: string, name: string) => line.match(new RegExp(`([\\w.]+(?:\\([\\w]*\\))?)\\.${name}\\(`))?.[1]?.concat(`.${name}`) ?? name;

function fold(lines: string[], raw: Event[]): Event[] {
  const sdkCalls = new Set(raw.filter((e) => e.kind === "call").map((e) => String(e.name)));
  const events: Event[] = [];
  const calls = new Map<number, Event>();
  for (const event of raw) {
    if (event.kind === "call") {
      const text = lines[(event.line ?? 1) - 1] ?? "";
      const names = [...text.matchAll(/(\w+)\(/g)].map((m) => m[1]);
      const assign = ASSIGN.exec(text)?.[1];
      const call: Event = { atMs: event.atMs, kind: "call", id: event.id, parent: event.parent, line: event.line,
        name: event.name, label: LABEL(text, String(event.name)), ...(event.delegated ? { delegated: true } : {}) };
      // The outermost recorded call on an assignment line (rightmost in a chain) produces the assigned value.
      if (assign && names.lastIndexOf(String(event.name)) === Math.max(...names.map((n, i) => (sdkCalls.has(n) ? i : -1)))) call.assign = assign;
      calls.set(Number(event.id), call);
      events.push(call);
    } else if (event.kind === "return") {
      const call = calls.get(Number(event.id));
      if (!call) continue;
      call.durationMs = event.atMs - call.atMs;
      if ("error" in event) call.error = event.error; else call.result = event.result;
    } else if ((event.kind === "stdout" || event.kind === "stderr") && events.at(-1)?.kind === event.kind && event.atMs - events.at(-1)!.atMs < 50) {
      events.at(-1)!.text += String(event.text);
    } else if (event.kind !== "exit") {
      events.push(event);
    }
  }
  return events;
}
// Coalesce a stream's deltas: one event per text part, tool state and run of tokens, with a count and end time.
// A session keeps whole strings: its replay rebuilds files from the agent's writes.
const clip = (value: unknown, limit = 1500): unknown => typeof value === "string" ? (value.length > limit ? `${value.slice(0, limit)}… (${value.length} chars)` : value)
  : Array.isArray(value) ? value.map((v) => clip(v, limit)) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clip(v, limit)])) : value;
const DELTAS = new Set(["message.part.updated", "token", "raw", "model-processing", "task.reasoning", "task.message.delta", "task.tool.updated"]);
function compact(events: Event[], limit = 1500): Event[] {
  const out: Event[] = [];
  const open = new Map<string, Event>();
  for (const event of events) {
    if (event.kind !== "stream" || !DELTAS.has(String(event.type))) { out.push(event); continue; }
    const data = event.data as { part?: { id?: string; type?: string; state?: { status?: string } }; taskId?: string } | undefined;
    const part = data?.part;
    // A batch task's deltas each carry their own part id: they coalesce per task instead.
    const key = data?.taskId ? `${event.parent}:${event.type}:${data.taskId}` : `${event.parent}:${event.type}:${part?.id ?? ""}:${part?.state?.status ?? ""}`;
    const last = open.get(key);
    if (last) {
      last.count = Number(last.count ?? 1) + Number(event.count ?? 1);
      last.endMs = event.endMs ?? event.atMs;
      const value = (event.data as { value?: unknown } | undefined)?.value;
      last.data = event.type === "token" && typeof value === "string" ? { ...(last.data as object), value: `${(last.data as { value?: string }).value ?? ""}${value}` } : clip(event.data, limit);
      continue;
    }
    if (part?.id && !data?.taskId) for (const [k] of open) if (k.startsWith(`${event.parent}:`) && !k.includes(":message.part.updated:")) open.delete(k);
    const kept = { ...event, data: clip(event.data, limit) };
    out.push(kept);
    open.set(key, kept);
  }
  return out;
}

function collect(record: Event[]) {
  const ids = new Set<string>();
  let costUsd: number | undefined;
  let fleetSpend: number | undefined;
  let streamCost: number | undefined;
  const visit = (value: unknown, key = ""): void => {
    if (!value || typeof value !== "object") {
      if (typeof value === "string" && /^(id|sandboxId|fleetId)$/.test(key)) ids.add(value);
      return;
    }
    for (const [k, v] of Object.entries(value)) visit(v, k);
  };
  for (const event of record) {
    visit(event.result);
    visit(event.data);
    const result = event.result as Record<string, unknown> | undefined;
    if (event.kind === "call" && result && typeof result.costUsd === "number" && /prompt|turn|run$|result/.test(String(event.name))) costUsd = (costUsd ?? 0) + result.costUsd;
    if (event.kind === "call" && result && typeof result.spentUsd === "number") fleetSpend = Math.max(fleetSpend ?? 0, result.spentUsd);
    // A turn the example streams itself has no result object; its terminal `done` event carries the cost the run reports.
    const turnCost = event.kind === "stream" && event.type === "done" ? (event.data as { totalCostUsd?: unknown } | undefined)?.totalCostUsd : undefined;
    if (typeof turnCost === "number") streamCost = (streamCost ?? 0) + turnCost;
    const spend = (event.data as { spend?: { spentUsd?: number } } | undefined)?.spend?.spentUsd;
    if (typeof spend === "number") fleetSpend = Math.max(fleetSpend ?? 0, spend);
  }
  // null: no call in the run reported a cost (Router chat replies and some harness turns carry usage only).
  const cost = fleetSpend ?? costUsd ?? streamCost;
  // The run id is the first sandbox, fleet or platform run the file made.
  const id = [...ids].find((value) => /^(sandbox|fleet|wfrun|run)[-_]/.test(value)) ?? [...ids][0] ?? null;
  return { id, costUsd: cost === undefined ? null : Number(cost.toFixed(4)) };
}

// A record holds what the pages and check:runs read, minus text naming this machine, a per-host route, a preview edge or
// agent session id, a private address or the account's usage, and credential-shaped assignments an agent printed; anything still key-shaped is not written.
const UNREAD = /^(host(name)?|baseUrl|ids|traceIds|node|parent|args|on)$/, ID = /(?<!^(fleet|trace|agent))I[dD]s?$/;
const scrub = (text: string) => text.replace(/(\n\S*Connection\S*\n\S*─+\S*)?\n\S*API URL:.*|\nPreview ID: .*/g, "").replaceAll(hostname(), "[redacted]").replace(/"account": \{(?:[^{}]|\{[^{}]*\})*\}/g, '"account": "…"')
  .replace(/\b(?:10(?:\.\d{1,3}){3}|(?:192\.168|172\.(?:1[6-9]|2\d|3[01]))(?:\.\d{1,3}){2}|\d+\.h\.tangle\.sh|edge-[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}|ses_\w{20,})\b/g, "[redacted]");
function save(path: string, record: RunRecord, key?: string) {
  const source = readFileSync(join(ROOT, record.source.path), "utf8");
  const events = record.events.flatMap((e) => {
    if (e.kind !== "stream" || /^(agent|fleet)\.(started|finished)$/.test(String(e.type))) return [e];
    const part = e.type === "message.part.updated" ? (e.data as { part?: Record<string, any> } | undefined)?.part : undefined;
    return part?.type === "tool" ? [{ ...e, data: { part: { id: part.id, type: "tool", tool: part.tool, state: { status: part.state?.status, input: part.state?.input } } } }] : [];
  });
  const json = JSON.stringify({ ...record, events }, (k, v) => UNREAD.test(k) || (ID.test(k) && !source.includes(k)) ? undefined : k === "account" ? "…" : typeof v === "string" ? scrub(v) : v, 1)
    .replace(/\b([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*)=([^\s"\\]+)/g, "$1=[redacted]")
    .replace(/proxy-[a-z-]+-token\.[\w-]+/g, "[redacted]");
  if ((key && json.includes(key)) || /sk-tan-[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{20,}\./.test(json)) throw new Error(`${path}: the record holds a credential; not written.`);
  writeFileSync(path, json + "\n");
}

async function runOnce(key: string, dir: string, idea: string, args: string[]) {
  const out = join(dir, `events-${Date.now()}.ndjson`);
  const file = join(dir, `${idea}.mts`);
  const child = spawn(process.execPath, ["--import", import.meta.url, file, ...args], {
    cwd: dir, stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, TANGLE_API_KEY: key, TANGLE_RECORD_EVENTS: out, TANGLE_RECORD_FILE: file },
  });
  const exitCode: number = await new Promise((done) => child.on("exit", (code) => done(code ?? 1)));
  const raw = existsSync(out) ? readFileSync(out, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as Event) : [];
  return { exitCode, raw };
}

async function record(key: string, target: string) {
  const [subject, idea] = target.split("/");
  const sourcePath = `src/examples/${target}.mts`;
  const source = readFileSync(join(ROOT, sourcePath), "utf8");
  // A fresh directory outside the repository, resolving the SDK through the harness's node_modules.
  const dir = mkdtempSync(join(tmpdir(), `record-${subject}-${idea}-`));
  symlinkSync(join(HARNESS, "node_modules"), join(dir, "node_modules"));
  copyFileSync(join(ROOT, sourcePath), join(dir, `${idea}.mts`));
  const fixture = join(ROOT, "scripts/fixtures/examples", idea);
  if (existsSync(fixture)) for (const f of readdirSync(fixture)) copyFileSync(join(fixture, f), join(dir, f));

  const recordedAt = new Date().toISOString();
  const started = Date.now();
  const codes: number[] = [];
  const raw: Event[] = [];
  let args: string[] = [];
  // A file that prints its own follow-up command (worker.mts) is run again with it, as its comment says.
  for (let phase = 0; phase < 2; phase++) {
    const atMs = Date.now() - started;
    const run = await runOnce(key, dir, idea, args);
    codes.push(run.exitCode);
    raw.push(...run.raw.map((event) => ({ ...event, atMs: event.atMs + atMs, ...(event.id ? { id: event.id + phase * 1e6 } : {}),
      ...(event.parent ? { parent: Number(event.parent) + phase * 1e6 } : {}) })));
    const follow = run.raw.filter((e) => e.kind === "stdout").map((e) => String(e.text)).join("").match(new RegExp(`npx tsx ${idea}\\.mts (.+)`));
    if (run.exitCode !== 0 || !follow) break;
    args = follow[1].trim().split(/\s+/);
  }
  const events = compact(fold(source.split("\n"), raw));
  const { id, costUsd } = collect(events);
  const exitCode = codes.every((code) => code === 0) && !events.some(failed) ? 0 : codes.at(-1)! || 1;
  const versions = Object.fromEntries([...new Set(["@tangle-network/sandbox", ...Array.from(source.matchAll(/from ["'](@tangle-network\/[^/"']+)/g), (match) => match[1])])].map((name) =>
    [name, JSON.parse(readFileSync(join(HARNESS, "node_modules", name, "package.json"), "utf8")).version]));
  const result: RunRecord = {
    source: { path: sourcePath, sha256: sourceDigest(source) },
    run: { id, recordedAt, exitCode, costUsd, sdk: versions },
    events,
  };
  mkdirSync(join(RUNS, subject), { recursive: true });
  save(join(RUNS, subject, `${idea}.json`), result, key);
  console.error(`recorded ${target}: exit ${exitCode}, ${events.length} events, $${costUsd}, ${Math.round((Date.now() - started) / 1000)} s`);
  return exitCode;
}

// ---------------------------------------------------------------------------------------------------------------
// Session: type each command of scripts/sessions/<name>.sh into bash and record it, what it printed and, for a `tangle`
// command, the agent stream inside it, into src/data/sessions/<name>.json. Then fetch every file the agent wrote from
// the preview URL the session printed, and delete the sandbox it created.
const commands = (source: string) => source.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
const sha256 = (text: string | Uint8Array) => createHash("sha256").update(text).digest("hex");
type Served = { path: string; file: string; status: number; sha256: string | null };

/** What a session publishes: its commands, what they printed, the agent's own text (`say`, printed once) and its tool calls. */
function sessionEvents(events: Event[]) {
  const said = new Set(events.map((e) => (e.data as { part?: { type?: string; text?: string } } | undefined)?.part).filter((part) => part?.type === "text").map((part) => String(part!.text).trim()));
  let last: unknown;
  return events.flatMap((e) => {
    if (e.kind === "call" || ((e.kind === "stdout" || e.kind === "stderr") && e.text === last)) return []; // the CLI prints its answer twice
    if (e.kind !== "stdout" && e.kind !== "stderr") return [e];
    last = e.text;
    return [{ ...e, kind: said.has(plain(String(e.text)).trim()) ? "say" : e.kind }];
  });
}

async function recordSession(key: string, name: string) {
  const sourcePath = `scripts/sessions/${name}.sh`;
  const source = readFileSync(join(ROOT, sourcePath), "utf8");
  const cli = realpathSync(join(HARNESS, "node_modules/@tangle-network/sandbox-cli/dist/index.mjs")), bin = join(HARNESS, "node_modules/.bin");
  const home = mkdtempSync(join(tmpdir(), `session-${name}-`)); // the CLI's own ~/.tangle, empty
  const t0 = Date.now(), recordedAt = new Date(t0).toISOString();
  const env = { PATH: `${bin}:${process.env.PATH}`, HOME: home, TANGLE_API_KEY: key, FORCE_COLOR: "1", COLUMNS: "96",
    NODE_OPTIONS: `--import ${import.meta.url}`, TANGLE_RECORD_FILE: cli, TANGLE_RECORD_T0: String(t0) };
  const raw: Event[] = [];
  let exitCode = 0, sandbox: string | undefined, url: string | undefined;
  for (const [index, text] of commands(source).entries()) {
    const out = join(home, `events-${index}.ndjson`);
    raw.push({ atMs: Date.now() - t0, kind: "command", text });
    const child = spawn("bash", ["-c", text], { cwd: home, env: { ...env, TANGLE_RECORD_EVENTS: out }, stdio: ["ignore", "pipe", "pipe"] });
    let printed = "";
    for (const stream of ["stdout", "stderr"] as const) child[stream].on("data", (chunk: Buffer) => {
      raw.push({ atMs: Date.now() - t0, kind: stream, text: chunk.toString() });
      printed += chunk.toString();
      process.stderr.write(chunk);
    });
    exitCode = await new Promise((done) => child.on("close", (code) => done(code ?? 1)));
    if (existsSync(out)) raw.push(...readFileSync(out, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as Event)
      .map((e) => ({ ...e, ...(e.id ? { id: e.id + (index + 1) * 1e6 } : {}), ...(e.parent ? { parent: Number(e.parent) + (index + 1) * 1e6 } : {}) })));
    sandbox ??= plain(printed).match(/Sandbox created: (\S+)/)?.[1];
    url ??= plain(printed).match(/Preview ready: (\S+)/)?.[1];
    if (exitCode !== 0) break;
  }
  const events = sessionEvents(compact(fold([], raw.sort((a, b) => a.atMs - b.atMs)), Infinity));

  // What the URL serves, against the files the agent wrote beside its index.html.
  const files = sessionFiles(events);
  const index = [...files.keys()].find((path) => path.endsWith("/index.html"));
  const served: Served[] = [];
  if (url && index) {
    const root = dirname(index);
    for (const [path, file] of [["/", index], ...[...files.keys()].filter((f) => f.startsWith(`${root}/`)).map((f) => [`/${relative(root, f)}`, f])]) {
      const response = await fetch(new URL(path, url)).catch(() => undefined);
      const body = response?.ok ? new Uint8Array(await response.arrayBuffer()) : undefined;
      served.push({ path, file, status: response?.status ?? 0, sha256: body ? sha256(body) : null });
    }
  }
  if (sandbox) await new Promise((done) => spawn(join(bin, "tangle"), ["sandbox", "delete", sandbox, "--force"],
    { env: { PATH: process.env.PATH, HOME: home, TANGLE_API_KEY: key }, stdio: ["ignore", "inherit", "inherit"] }).on("close", done));
  const result: RunRecord = { source: { path: sourcePath, sha256: sha256(commands(source).join("\n")) }, run: { recordedAt, exitCode, url: url ?? null, served }, events };
  mkdirSync(SESSION_RUNS, { recursive: true });
  save(join(SESSION_RUNS, `${name}.json`), result, key);
  const failures = sessionFailures(name, result);
  for (const failure of failures) console.error(failure);
  console.error(`recorded session ${name}: exit ${exitCode}, ${events.length} events, ${files.size} files, ${Math.round((Date.now() - t0) / 1000)} s, ${url ?? "no URL"}`);
  return exitCode || (failures.length ? 1 : 0);
}

// A session's record matches its commands, exited 0, and every file its URL served is the file the agent wrote.
function sessionFailures(name: string, record: RunRecord) {
  const failures: string[] = [];
  if (record.source.sha256 !== sha256(commands(readFileSync(join(SESSIONS, `${name}.sh`), "utf8")).join("\n"))) failures.push(`session ${name}: the record is for other commands; re-record it`);
  if (record.run.exitCode !== 0) failures.push(`session ${name}: the recorded session exited ${record.run.exitCode}`);
  const files = sessionFiles(record.events);
  const served = (record.run.served ?? []) as Served[];
  if (!served.some((s) => s.status === 200)) failures.push(`session ${name}: its URL served none of the files the agent wrote`);
  for (const s of served) if (s.status === 200 && sha256(files.get(s.file) ?? "") !== s.sha256) failures.push(`session ${name}: ${s.path} served other bytes than the agent wrote to ${s.file}`);
  return failures;
}

// ---------------------------------------------------------------------------------------------------------------
// Check: every example has a fresh, matching, successful record whose call lines name their calls.
function check() {
  const failures: string[] = [];
  const files = new Set(examples());
  for (const [target, reason] of Object.entries(NO_RUN)) {
    if (!files.has(target)) failures.push(`${target}: listed in NO_RUN (${reason}) but has no example file`);
    else if (existsSync(join(RUNS, `${target}.json`))) failures.push(`${target}: has a record, so it is no longer exempt (${reason}); remove it from NO_RUN`);
  }
  for (const target of files) {
    if (target in NO_RUN) continue;
    const path = join(RUNS, `${target}.json`);
    if (!existsSync(path)) { failures.push(`${target}: no record at ${relative(ROOT, path)}`); continue; }
    const record = JSON.parse(readFileSync(path, "utf8")) as RunRecord;
    const source = readFileSync(join(EXAMPLES, `${target}.mts`), "utf8"), lines = source.split("\n");
    if (record.source.sha256 !== sourceDigest(source)) failures.push(`${target}: the record is for another version of the file; re-record it`);
    if (record.run.exitCode !== 0) failures.push(`${target}: the recorded run exited ${record.run.exitCode}`);
    if (!((Date.now() - Date.parse(record.run.recordedAt)) / 86_400_000 <= MAX_AGE_DAYS)) failures.push(`${target}: recorded ${record.run.recordedAt}, over ${MAX_AGE_DAYS} days ago`);
    for (const event of record.events) {
      // A delegated call (openaiTools' handler running the model's tool calls) maps to the line that called the helper.
      const text = lines[(event.line ?? 0) - 1] ?? "";
      if (event.kind === "call" && !(event.delegated ? /\w\(/.test(text) : text.includes(`${event.name}(`))) failures.push(`${target}: line ${event.line} does not call ${event.name}`);
    }
    if (!record.events.some((event) => event.kind === "call")) failures.push(`${target}: the record has no SDK calls`);
    for (const e of record.events.filter(failed)) failures.push(`${target}: line ${e.line} ${e.name} failed: ${JSON.stringify(e.error ?? (e.result as { error?: unknown }).error).slice(0, 140)}`);
  }
  for (const subject of existsSync(RUNS) ? readdirSync(RUNS) : []) {
    for (const f of readdirSync(join(RUNS, subject))) if (!files.has(`${subject}/${f.replace(/\.json$/, "")}`)) failures.push(`${subject}/${f}: a record with no example file`);
  }
  const sessions = readdirSync(SESSIONS).filter((f) => f.endsWith(".sh")).map((f) => f.slice(0, -3));
  for (const name of sessions) {
    const path = join(SESSION_RUNS, `${name}.json`);
    if (existsSync(path)) failures.push(...sessionFailures(name, JSON.parse(readFileSync(path, "utf8")) as RunRecord));
    else failures.push(`session ${name}: no record at ${relative(ROOT, path)}`);
  }
  for (const f of existsSync(SESSION_RUNS) ? readdirSync(SESSION_RUNS) : []) if (!sessions.includes(f.replace(/\.json$/, ""))) failures.push(`${f}: a session record with no session file`);
  for (const failure of failures) console.error(`check:runs: ${failure}`);
  if (failures.length) process.exit(1);
  const exempt = Object.entries(NO_RUN).map(([target, reason]) => `${target} (${reason})`);
  console.log(`check:runs: ${files.size - exempt.length} examples have fresh, matching, successful recorded runs; no run, by exemption: ${exempt.join(", ") || "none"}; ${sessions.length} sessions serve the files their agents wrote`);
}

const preload = process.env.TANGLE_RECORD_EVENTS;
if (preload && process.argv[1] !== fileURLToPath(import.meta.url)) {
  await instrument(preload, process.env.TANGLE_RECORD_FILE!);
} else if (process.argv.includes("--check")) {
  check();
} else if (process.argv.includes("--resave")) { // publish every record again through save(), as after a change to it
  for (const target of examples().filter((t) => existsSync(join(RUNS, `${t}.json`)))) {
    const path = join(RUNS, `${target}.json`), { source, run: { id, recordedAt, exitCode, costUsd, sdk }, events } = JSON.parse(readFileSync(path, "utf8")) as RunRecord;
    save(path, { source, run: { id, recordedAt, exitCode, costUsd, sdk }, events });
  }
  for (const f of readdirSync(SESSION_RUNS)) {
    const path = join(SESSION_RUNS, f), { source, run: { recordedAt, exitCode, url, served }, events } = JSON.parse(readFileSync(path, "utf8")) as RunRecord;
    save(path, { source, run: { recordedAt, exitCode, url, served }, events: sessionEvents(events) });
  }
} else if (process.argv.includes("--session")) {
  const key = readFileSync(0, "utf8").trim();
  if (!key) throw new Error("Pipe the production key on stdin.");
  process.exit(await recordSession(key, process.argv[process.argv.indexOf("--session") + 1]));
} else {
  const key = readFileSync(0, "utf8").trim();
  if (!key) throw new Error("Pipe the production key on stdin.");
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : examples().filter((target) => !(target in NO_RUN));
  const concurrency = Number(process.env.RECORD_CONCURRENCY ?? 4);
  const queue = [...targets];
  const codes: Record<string, number> = {};
  await Promise.all(Array.from({ length: concurrency }, async () => {
    for (let target = queue.shift(); target; target = queue.shift()) {
      codes[target] = await record(key, target).catch((error) => { console.error(`${target}: ${error.message}`); return 1; });
    }
  }));
  console.error(JSON.stringify(codes));
  process.exit(Object.values(codes).some(Boolean) ? 1 : 0);
}
