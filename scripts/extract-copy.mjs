const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function attributesFor(tag) {
  const attributes = new Map();
  const pattern = /\s([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    if (!attributes.has(name)) attributes.set(name, match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

// Hidden states contribute no visible copy; retain all text in expandable sections.
function removeHidden(html) {
  const tags = /<(?:!--[\s\S]*?--|\/?[A-Za-z](?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let cursor = 0;
  let depth = 0;
  let output = '';
  for (const match of html.matchAll(tags)) {
    const tag = match[0];
    if (depth === 0) output += html.slice(cursor, match.index);
    const name = /^<\/?([\w:-]+)/.exec(tag)?.[1]?.toLowerCase();
    const closing = /^<\//.test(tag);
    const leaf = !name || voidTags.has(name) || /\/>$/.test(tag);
    const attributes = attributesFor(tag);
    const classes = (attributes.get('class') ?? '').split(/\s+/);
    const hidden = attributes.has('hidden');
    // The shared chart stylesheet clips this complete table for screen readers.
    const clippedChartData = classes.includes('tgc-accessible-data');
    if (depth > 0) {
      if (closing) depth -= 1;
      else if (!leaf) depth += 1;
    } else if (!closing && (hidden || clippedChartData)) {
      if (!leaf) depth = 1;
    } else output += tag;
    cursor = match.index + tag.length;
  }
  return depth === 0 ? output + html.slice(cursor) : output;
}

export function extractCopy(html, route = '') {
  // Audit the article itself, not the shared navigation and footer.
  // Those shared regions can consume the input cap and make a complete
  // article look truncated to the reviewer.
  const article = html.match(/<article\b[^>]*\bclass="[^"]*\bblog-article\b[^"]*"[\s\S]*?<\/article>/i)?.[0] ?? html;
  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? html;
  // The homepage audits the shared header and footer once. Every other
  // route is judged on its own main content so shared copy cannot create
  // the same deduction across the entire site.
  const page = article !== html ? article : route === '/' ? html : main;
  const visible = removeHidden(page.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, ''));
  const chartLabels = new Set();
  return visible
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, (svg) => {
      const labels = [...svg.matchAll(/\baria-label=(["'])(.*?)\1/gi)]
        .map((match) => match[2]).filter((label) => {
          if (chartLabels.has(label)) return false;
          chartLabels.add(label);
          return true;
        });
      return labels.length ? `\nChart: ${labels.join('\n')}\n` : '';
    })
    .replace(/<figure\b[^>]*\baria-label=(["'])(.*?)\1[^>]*>/gi, (_tag, _quote, label) => `<figure>\nChart: ${label}\n`)
    .replace(/<details\b(?![^>]*\sopen(?:\s|=|>))[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>/gi,
      (_tag, label) => `<details>\nExpandable section: ${label}\n`)
    .replace(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi, (_tag, label) => `\n${label}\n`)
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // CSS can visually separate adjacent inline labels even though raw
    // textContent joins them. Preserve that boundary without inserting
    // spaces between syntax-highlighter spans, which use style attributes.
    .replace(/<\/span>\s*(?=<span\b[^>]*\bclass=["'][^"']*\bline\b)/gi, '</span>\n')
    .replace(/<\/span>\s*<span\b(?=[^>]*\bclass=["'][^"']*\bvbb-(?:leg|sub|profile|n|cost)\b)/gi, '</span> · <span')
    .replace(/<\/span>\s*<em\b/gi, '</span> <em')
    .replace(/<\/em>\s*<span\b/gi, '</em> <span')
    .replace(/<\/em>\s*<small\b/gi, '</em> · <small')
    .replace(/<\/button>\s*(?=<button\b)/gi, '</button> · ')
    .replace(/<\/dt>\s*<dd\b/gi, '</dt> · <dd')
    .replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_match, _quote, href, label) => `${label} [${href}]`)
    .replace(/<\/(?:th|td)>/gi, ' | ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|div|section|article|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
