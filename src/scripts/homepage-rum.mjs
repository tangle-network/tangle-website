import { onCLS, onFCP, onINP, onLCP } from 'web-vitals';

export function startRum() {
  const production = ['www.tangle.tools', 'tangle.tools'].includes(location.hostname);
  const context = {
    homepage_mode: document.documentElement.dataset.homeSpeed ?? 'unknown',
    build_revision: document.documentElement.dataset.homeBuild ?? 'unknown',
    viewport_group: matchMedia('(max-width: 860px)').matches ? 'small' : 'large',
  };
  const report = ({ name, value }) => {
    const payload = { ...context, metric_value: value, value };
    if (production && typeof window.gtag === 'function') {
      window.gtag('event', `homepage_${name.toLowerCase()}`, payload);
    } else if (!production) {
      (window.__homeRumEvents ??= []).push({ name, ...payload });
    }
  };

  onFCP(report);
  onLCP(report);
  onCLS(report);
  onINP(report);
  window.__homeRumReady = true;
}
