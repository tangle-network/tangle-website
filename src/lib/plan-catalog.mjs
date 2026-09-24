export function publicPlans(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) throw new Error('The plan catalog is unavailable.');
  const seen = new Set();
  return value.map((plan) => {
    if (!plan || typeof plan !== 'object' || typeof plan.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(plan.id) || seen.has(plan.id) ||
        typeof plan.name !== 'string' || !plan.name.trim() || typeof plan.description !== 'string' ||
        !Number.isSafeInteger(plan.monthlyPriceCents) || plan.monthlyPriceCents < 0 ||
        !Number.isSafeInteger(plan.creditsPerMonth) || plan.creditsPerMonth < 0 ||
        !Array.isArray(plan.features) || !plan.features.every((feature) => typeof feature === 'string')) throw new Error('The plan catalog is incomplete.');
    seen.add(plan.id);
    return { id: plan.id, name: plan.monthlyPriceCents === 0 && plan.creditsPerMonth === 0 ? 'Pay as you go' : plan.name,
      description: plan.description, monthlyPriceCents: plan.monthlyPriceCents,
      creditsPerMonth: plan.creditsPerMonth, features: plan.features };
  });
}
export function money(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Invalid USD cents.');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}
export async function loadPublicPlans(fetcher = fetch) {
  const response = await fetcher('https://id.tangle.tools/api/v1/plans', {
    credentials: 'omit', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Current plans could not be loaded.');
  const body = await response.text();
  if (body.length > 128000) throw new Error('Unexpected plan catalog size.');
  return { plans: publicPlans(JSON.parse(body)), revision: response.headers.get('etag'), loadedAt: new Date().toISOString() };
}
