import { createHash } from 'node:crypto';
// Full-line comments and blank lines do not change what ran, so a comment edit keeps a record valid.
export const sourceDigest = (code) => createHash('sha256').update(code.split('\n').filter((l) => l.trim() && !l.trim().startsWith('//')).join('\n')).digest('hex');
