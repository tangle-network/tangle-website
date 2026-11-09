// What the agent did in a recorded session (scripts/record-examples.mts --session), from the tool parts its stream
// carried. Claude Code names its tools Write, Edit, MultiEdit and Bash with snake_case inputs; OpenCode and Pi use
// lower-case names and camelCase inputs. The replay and the recorder's check rebuild files with the same code.

/** @typedef {{ atMs: number, endMs?: number, id: string, tool: string, input: Record<string, any>, status: string, output?: string }} Step */

/** One step per tool call: when its input arrived, when it settled, and what it returned. @returns {Step[]} */
export function agentSteps(events) {
  const steps = new Map();
  for (const event of events) {
    const part = event.kind === 'stream' && event.type === 'message.part.updated' ? event.data?.part : undefined;
    if (part?.type !== 'tool' || !part.id) continue;
    const state = part.state ?? {};
    const step = steps.get(part.id) ?? { atMs: event.atMs, id: part.id, tool: String(part.tool ?? ''), input: {}, status: 'pending' };
    if (state.input && Object.keys(state.input).length && !Object.keys(step.input).length) step.atMs = event.atMs;
    if (state.input && Object.keys(state.input).length) step.input = state.input;
    if (state.status) step.status = state.status;
    if (state.status === 'completed' || state.status === 'error') {
      step.endMs = event.atMs;
      step.output = typeof state.output === 'string' ? state.output : typeof state.error === 'string' ? state.error : undefined;
    }
    steps.set(part.id, step);
  }
  return [...steps.values()].sort((a, b) => a.atMs - b.atMs);
}

/** write, edit, bash or other. */
export const stepKind = (/** @type {Step} */ step) => {
  const tool = step.tool.toLowerCase();
  return tool === 'write' ? 'write' : tool === 'edit' || tool === 'multiedit' ? 'edit' : tool === 'bash' ? 'bash' : 'other';
};
export const stepPath = (/** @type {Step} */ step) => step.input.file_path ?? step.input.filePath ?? step.input.path;

/** Apply one write or edit to `files`; a step that failed, or edits a file the record never saw, changes nothing. */
export function applyStep(/** @type {Map<string, string>} */ files, /** @type {Step} */ step) {
  const path = stepPath(step), kind = stepKind(step);
  if (step.status === 'error' || typeof path !== 'string') return files;
  if (kind === 'write' && typeof step.input.content === 'string') files.set(path, step.input.content);
  if (kind === 'edit' && files.has(path)) {
    let text = /** @type {string} */ (files.get(path));
    for (const edit of step.input.edits ?? [step.input]) {
      const from = edit.old_string ?? edit.oldString, to = edit.new_string ?? edit.newString;
      if (typeof from !== 'string' || typeof to !== 'string') continue;
      text = edit.replace_all ?? edit.replaceAll ? text.split(from).join(to) : text.replace(from, () => to);
    }
    files.set(path, text);
  }
  return files;
}

/** Terminal text without its color codes. */
export const plain = (/** @type {string} */ text) => text.replace(/\x1b\[[0-9;]*m/g, '');

/** Every file the agent wrote, as it stood when the session ended. */
export const sessionFiles = (events) => agentSteps(events).reduce(applyStep, new Map());
