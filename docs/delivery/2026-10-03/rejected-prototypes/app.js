import { examples } from './examples.js';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function highlight(code) {
  return code.split('\n').map((line, i) => {
    const pattern = /(\/\/.*$|'[^']*'|"[^"]*"|\b(?:import|from|const|await|new|return|true|false|export)\b|\b\d+\b)/g;
    let html = '', end = 0;
    for (const match of line.matchAll(pattern)) {
      html += escape(line.slice(end, match.index));
      const token = match[0];
      const kind = token.startsWith('//') ? 'comment' : /^['"]/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : 'keyword';
      html += '<span class="token-' + kind + '">' + escape(token) + '</span>';
      end = match.index + token.length;
    }
    html += escape(line.slice(end));
    return '<span class="line" data-line="' + (i + 1) + '">' + html + '</span>';
  }).join('\n');
}
let selected = 'sandbox';
let manualTheme = false;
const artifacts = {
 sandbox: {label: 'Example app', href: 'demo.html', html: '<iframe id="app-preview" src="demo.html" title="Interactive Fieldnotes example app"></iframe>'},
 research: {label: 'Example research workspace', href: 'https://sandbox.tangle.tools/docs/agents/fleet', html: '<div class="research-view"><span>RESEARCH BRIEF</span><h3>What will power the next data center?</h3><a class="research-file" href="https://www.energy.gov/oe/energy-storage" target="_blank" rel="noopener"><span class="file-icon">▤</span><div>Energy storage<small>Compare technologies and deployment constraints</small></div><span>↗</span></a><a class="research-file" href="https://www.energy.gov/gdo/grid-deployment-office" target="_blank" rel="noopener"><span class="file-icon">▤</span><div>Grid capacity<small>Investigate transmission and connection timelines</small></div><span>↗</span></a><a class="research-file" href="https://www.iea.org/reports/energy-and-ai" target="_blank" rel="noopener"><span class="file-icon">▤</span><div>Power demand<small>Find forecasts and examine their assumptions</small></div><span>↗</span></a></div>'},
 browser: {label: 'Browser · docs.tangle.tools', href: 'https://docs.tangle.tools', html: '<a href="https://docs.tangle.tools" target="_blank" rel="noopener"><img class="browser-capture" src="assets/browser-docs.png" alt="The Tangle documentation homepage open in a browser"></a>'},
 models: {label: 'Model routing', href: 'https://router.tangle.tools/models', html: '<div class="model-view"><span>OPENAI-COMPATIBLE API</span><h3>Choose the model<br>for the work.</h3><div class="model-route">Your application <span>→</span> Tangle Router</div><div class="model-route">Tangle Router <span>→</span> gpt-5-mini</div><pre>https://router.tangle.tools/v1</pre><p>Use a Tangle key, or connect your own provider keys.</p><a href="https://router.tangle.tools/models">Explore available models ↗</a></div>'}
};
function selectExample(key, focus = false) {
  selected = key;
  const example = examples[key];
  $$('.example-tabs button').forEach(button => {
    const active = button.dataset.example === key;
    button.setAttribute('aria-selected', active);
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  $('#example-panel').setAttribute('aria-labelledby', 'tab-' + key);
  $('#filename').textContent = example.filename;
  $('#language').textContent = example.language === 'typescript' ? 'TypeScript' : 'YAML';
  $('#install').textContent = example.install;
  $('#source').innerHTML = highlight(example.code);
  $('#example-docs').href = example.docsUrl;
  $('#artifact-label').textContent = artifacts[key].label;
  $('#artifact-content').innerHTML = artifacts[key].html;
  $('#open-artifact').href = artifacts[key].href;
  $('#open-artifact').setAttribute('aria-label', 'Open ' + artifacts[key].label.toLowerCase());
  $('#theme-demo').hidden = key !== 'sandbox';
  $('#copy-status').textContent = '';
}
$$('.example-tabs button').forEach(button => button.addEventListener('click', () => selectExample(button.dataset.example)));
$('.example-tabs').addEventListener('keydown', event => {
  const tabs = $$('.example-tabs button');
  const index = tabs.findIndex(x => x.dataset.example === selected);
  let next = index;
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;
  event.preventDefault(); selectExample(tabs[next].dataset.example, true);
});
$('#theme-demo').addEventListener('click', () => {
  manualTheme = true;
  $('#app-preview')?.contentWindow.postMessage('toggle-theme', location.origin);
  $('#theme-demo').setAttribute('aria-label', 'Toggle example app theme');
});
selectExample('sandbox');
$('#workflow-source').innerHTML = highlight(examples.workflows.code);
$('#workflow-code-toggle').addEventListener('click', () => {
  const panel = $('#workflow-code');
  panel.hidden = !panel.hidden;
  $('.diagram').hidden = !panel.hidden;
  $('.diagram').style.display = panel.hidden ? '' : 'none';
  $('#workflow-code-toggle').setAttribute('aria-expanded', !panel.hidden);
  $('#workflow-code-toggle').innerHTML = panel.hidden ? 'View code <span>〈/〉</span>' : 'View workflow <span>↗</span>';
});
let configCode = '';
function updateConfig() {
  const cpu = Number($('#cpu').value);
  const mode = $('#network').value;
  const domains = $('#domains').value.split(',').map(x => x.trim()).filter(Boolean);
  $('#cpu-value').textContent = cpu;
  $('#domains').disabled = mode !== 'strict';
  const policy = mode === 'strict' ? '{\n    mode: \'strict\',\n    allowDomains: ' + JSON.stringify(domains).replaceAll('"', "'") + ',\n  }' : "{ mode: '" + mode + "' }";
  configCode = "import { Sandbox } from '@tangle-network/sandbox';\n\nconst tangle = new Sandbox({\n  apiKey: process.env.TANGLE_API_KEY!,\n  baseUrl: 'https://sandbox.tangle.tools',\n});\n\nconst workspace = await tangle.create({\n  environment: 'universal',\n  resources: { cpuCores: " + cpu + ", memoryMB: 4096, diskGB: 20 },\n  maxLifetimeSeconds: 1800,\n  egressPolicy: " + policy + ",\n});\n\nconsole.log(workspace.id);";
  $('#config-source').innerHTML = highlight(configCode);
}
['cpu', 'network', 'domains'].forEach(id => $('#' + id).addEventListener('input', updateConfig));
updateConfig();
$$('.copy').forEach(button => button.addEventListener('click', () => {
  const source = button.dataset.copy;
  const text = source === 'example' ? examples[selected].code : source === 'install' ? examples[selected].install : source === 'workflow' ? examples.workflows.code : configCode;
  navigator.clipboard.writeText(text).then(() => {
    const original = button.innerHTML;
    button.innerHTML = '✓';
    button.setAttribute('aria-label', 'Copied');
    $('#copy-status').textContent = 'Copied';
    setTimeout(() => {button.innerHTML = original;button.setAttribute('aria-label', 'Copy ' + source);$('#copy-status').textContent = '';}, 1800);
  }, () => {$('#copy-status').textContent = 'Select the code to copy it.';});
}));
const stages = [
 ['Start with the question.', 'A request starts the workflow. The same definition can run on a schedule or respond to an event.'],
 ['Give each agent a part.', 'Agents research the market, the technology, and the companies in parallel. Their findings come together in a single brief.'],
 ['Make room for your judgment.', 'Read the combined brief and its sources. Approve or reject it before the workflow continues.'],
 ['Keep the work it produces.', 'The brief and the decision stay with the workflow. Return to the sources or use the result in the next step.']
];
let stage = -1;
let manualUntilScroll = false;
function setStage(next) {
  if (next === stage) return;
  stage = next;
  $('.workflow-board').dataset.stage = next;
  $$('.workflow-stages button').forEach(button => {
    const active = Number(button.dataset.stage) === next;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  $('#workflow-title').textContent = stages[next][0];
  $('#workflow-description').textContent = stages[next][1];
}
$$('.workflow-stages button').forEach(button => button.addEventListener('click', () => {manualUntilScroll = true;setStage(Number(button.dataset.stage));}));
setStage(0);
const track = $('.workflow-track');
function scrollScene() {
 if (innerWidth <= 760 || reduced || manualUntilScroll) return;
 const rect = track.getBoundingClientRect();
 const distance = track.offsetHeight - $('.workflow-sticky').offsetHeight;
 const progress = Math.max(0, Math.min(1, -rect.top / distance));
 $('.track-progress span').style.width = (progress * 100) + '%';
 setStage(Math.min(3, Math.floor(progress * 4)));
}
let scrollTick = false;
window.addEventListener('scroll', () => {
 manualUntilScroll = false;
 if (scrollTick) return;
 scrollTick = true;
 requestAnimationFrame(() => {scrollScene();scrollTick = false;});
}, {passive:true});
window.addEventListener('resize', scrollScene);
const spans = [
 ['Model call', 'Plan the change', 'The agent reads the task and chooses which files to inspect.'],
 ['File access', 'Read checkout.test.ts', 'Follow the file the agent reads before making a change.'],
 ['Shell command', 'Run the test suite', 'The full suite takes most of this example run. Inspect the command and its place in the sequence.'],
 ['File change', 'Edit retry-policy.ts', 'Connect a code change to the model calls and tool use that led to it.'],
 ['Shell command', 'Run the test suite', 'A second full-suite run makes the repeated work visible. Compare another approach before changing the agent.']
];
$$('[data-span]').forEach(button => button.addEventListener('click', () => {
 const n = Number(button.dataset.span);
 $$('[data-span]').forEach(x => x.classList.toggle('selected', Number(x.dataset.span) === n));
 $('#trace-kind').textContent = spans[n][0];$('#trace-heading').textContent = spans[n][1];$('#trace-body').textContent = spans[n][2];
}));
// The knot is brand artwork. These paths are not a representation of execution.
const canvas = $('#filaments');
const context = canvas.getContext('2d');
let visible = true;
new IntersectionObserver(entries => visible = entries[0].isIntersecting).observe(canvas);
let width, height, pixelRatio;
const resize = () => {width=canvas.clientWidth;height=canvas.clientHeight;pixelRatio=Math.min(devicePixelRatio,2);canvas.width=width*pixelRatio;canvas.height=height*pixelRatio;context.setTransform(pixelRatio,0,0,pixelRatio,0,0);};
new ResizeObserver(resize).observe(canvas);
resize();
let pointer = 0;
window.addEventListener('pointermove', e => pointer = (e.clientX / innerWidth - .5) * .2, {passive:true});
function point(t, phase, time) {
 const r=2 + .62*Math.cos(3*t + phase);
 let x=r*Math.cos(2*t),y=r*Math.sin(2*t),z=.72*Math.sin(3*t + phase);
 const angle=.43+Math.sin(time*.00014)*.1+pointer;
 const xx=x*Math.cos(angle)+z*Math.sin(angle),zz=-x*Math.sin(angle)+z*Math.cos(angle);
 const yy=y*.7+zz*.6;
 const scale=Math.min(width*.145,height*.31);
 return [width*.62+xx*scale,height*.48+yy*scale,zz];
}
function frame(time) {
 requestAnimationFrame(frame);
 if(!visible) return;
 context.clearRect(0,0,width,height);
 const clock = reduced ? 0 : time;
 for(let strand=0;strand<15;strand++) {
  const phase=strand*.017;
  context.beginPath();
  for(let i=0;i<=430;i++) {
   const p=point(i/430*Math.PI*2,phase,clock);
   if(i===0)context.moveTo(p[0]+strand*.25,p[1]);else context.lineTo(p[0]+strand*.25,p[1]);
  }
  context.strokeStyle='rgba(157,145,238,'+(.06+strand*.002)+')';context.lineWidth=.7;context.stroke();
 }
 for(let i=0;i<7;i++) {
  const t=(clock*.000055 + i*.89)%(Math.PI*2);
  const p=point(t,i*.02,clock);
  context.beginPath();context.arc(p[0],p[1],1.5,0,Math.PI*2);context.fillStyle='#ded8ff';context.shadowColor='#b9a8ff';context.shadowBlur=15;context.fill();context.shadowBlur=0;
 }
}
requestAnimationFrame(frame);

function fitWires() {
  const root = $('.diagram');
  const svg = $('.connectors');
  const area = root.getBoundingClientRect();
  if (!area.width || !area.height || innerWidth <= 760) return;
  svg.setAttribute('viewBox', '0 0 ' + area.width + ' ' + area.height);
  const rect = selector => {
    const b = selector.getBoundingClientRect();
    return {left: b.left-area.left, right:b.right-area.left, cy:b.top-area.top+b.height/2};
  };
  const from = rect($('.request'));
  const workers = $$('.worker').map(rect);
  const review = rect($('.review'));
  const report = rect($('.report-document'));
  const path = (start, end) => {
    const mid = (start.right+end.left)/2;
    return 'M'+start.right+' '+start.cy+'H'+mid+'V'+end.cy+'H'+end.left;
  };
  const branch = workers.map(w => path(from,w)).join('');
  const join = workers.map(w => path(w,review)).join('');
  const finish = path(review,report);
  $('.wire').setAttribute('d',branch+join+finish);
  $('.s1').setAttribute('d',branch);$('.s2').setAttribute('d',join);$('.s3').setAttribute('d',finish);
}
new ResizeObserver(fitWires).observe($('.diagram'));
document.fonts.ready.then(fitWires);

window.addEventListener('message', event => {
  if (event.origin === location.origin && event.data === 'theme-chosen') manualTheme = true;
});
new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && selected === 'sandbox' && !manualTheme && !reduced) {
    $('#app-preview')?.contentWindow.postMessage('dark-theme', location.origin);
  }
}, {threshold: .5}).observe($('.agents-strip'));
