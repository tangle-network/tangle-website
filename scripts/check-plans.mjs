// Fails the deploy when the plans the homepage states differ from the plans
// the identity service serves, or when the built page does not render them.
import { readFile } from 'node:fs/promises';
import { PLANS, PLANS_URL, planPrice } from '../src/data/plans.mjs';

export function comparePlans(served) {
  const problems = [];
  const list = served && Array.isArray(served.data) ? served.data : null;
  if (!list) return ['the served body has no data array'];
  for (const plan of PLANS) {
    const live = list.find((item) => item.id === plan.id);
    if (!live) { problems.push(`${plan.id}: the website states this plan and the catalog does not serve it`); continue; }
    for (const key of ['name', 'monthlyPriceCents', 'creditsPerMonth']) {
      if (live[key] !== plan[key]) problems.push(`${plan.id}.${key}: the catalog serves ${JSON.stringify(live[key])}, the website states ${JSON.stringify(plan[key])}`);
    }
    if (JSON.stringify(live.features) !== JSON.stringify(plan.features)) problems.push(`${plan.id}.features: the catalog serves ${JSON.stringify(live.features)}, the website states ${JSON.stringify(plan.features)}`);
    if (Boolean(live.isPopular) !== plan.popular) problems.push(`${plan.id}.isPopular: the catalog serves ${Boolean(live.isPopular)}, the website states ${plan.popular}`);
  }
  for (const live of list) {
    if (!PLANS.some((plan) => plan.id === live.id)) problems.push(`${live.id}: the catalog serves this plan and the website does not state it`);
  }
  return problems;
}

export function renderedPlanProblems(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const problems = [];
  for (const plan of PLANS) {
    if (!html.includes(`data-plan="${plan.id}"`)) problems.push(`the page has no plan card for ${plan.id}`);
    if (!text.includes(planPrice(plan))) problems.push(`the page does not print ${plan.name}'s price ${planPrice(plan)}`);
    for (const feature of plan.features) if (!text.includes(feature)) problems.push(`the page does not say: ${feature}`);
  }
  return problems;
}

async function main() {
  let served;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(PLANS_URL, { headers: { accept: 'application/json' } });
      if (response.status !== 200) throw new Error(`${PLANS_URL} answered ${response.status}`);
      served = await response.json();
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  const problems = [...comparePlans(served), ...renderedPlanProblems(await readFile('dist/client/index.html', 'utf8'))];
  if (problems.length) {
    console.error(`check:plans failed:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`check:plans ok: ${PLANS.length} plans match ${PLANS_URL} and render on the homepage`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) await main();
