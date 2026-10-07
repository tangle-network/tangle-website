/**
 * The copy audit's model: zai/glm-5.3, which the Router serves on the company's flat Z.ai coding plan.
 * Until 2026-10-06 the audit ran on gpt-5.6-luna through the Router's direct OpenAI route, billed per
 * token: $11.21 of the Router's OpenAI spend in the two weeks before its OpenAI balance ran out.
 */
export const COPY_AUDIT_MODEL = 'zai/glm-5.3';

/** Whether a requested or served model id is the audit's model. The Router reports it served as `glm-5.3`. */
export const isCopyAuditModel = (model) => typeof model === 'string' && /^(zai\/)?glm-5\.3$/.test(model);
