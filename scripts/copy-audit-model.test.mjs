import assert from 'node:assert/strict';
import test from 'node:test';

import { COPY_AUDIT_MODEL, isCopyAuditModel } from './copy-audit-model.mjs';

test('the copy audit runs on zai/glm-5.3 and accepts only that model as requested or served', () => {
  assert.equal(COPY_AUDIT_MODEL, 'zai/glm-5.3');
  assert.equal(isCopyAuditModel('zai/glm-5.3'), true);
  assert.equal(isCopyAuditModel('glm-5.3'), true, 'the Router names the served model without its provider');
  for (const model of ['gpt-5.6-luna', 'openai/gpt-5.6-luna', 'zai/glm-5.2', 'glm-5.3-flash', null]) {
    assert.equal(isCopyAuditModel(model), false, String(model));
  }
});
