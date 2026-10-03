import { createFleetStage } from './fleet-stage.js'
import { examples } from '../examples.js'
import { interactiveExample, researchWorkflowExample } from './interactive-example.js'

const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const mobile = matchMedia('(max-width: 760px)')
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]))
let toastTimer
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2200) }
async function copy(text) { await navigator.clipboard.writeText(text); toast('Copied') }

const fleet = createFleetStage($('#fleet-stage'), { onSelect: (index) => { $('#fleet-stage').dataset.selectedAgent = String(index) } })
const captions = [
 'Open a terminal. Run the agent you already use.',
 'Give each agent its own workspace. Follow their work together.',
 'Send tasks from your application. Stay connected to the terminal.',
 'Bring the files and results into the product you build.',
]
const stops = [0, .5, .78, 1]
let activeProgress = 0
function updateFleet(progress) {
 activeProgress = Math.min(1, Math.max(0, progress))
 fleet.setProgress(activeProgress)
 const index = activeProgress < .26 ? 0 : activeProgress < .64 ? 1 : activeProgress < .91 ? 2 : 3
 $('#fleet-caption').textContent = captions[index]
 $('#fleet-progress').style.width = `${activeProgress * 100}%`
 $$('.scene-steps button').forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)))
 $('#fleet-stage').dataset.scrollProgress = activeProgress.toFixed(3)
}
let scrollFrame = 0
function updateFromScroll() {
 scrollFrame = 0
 if (mobile.matches || reduced.matches) return
 const track = $('.fleet-track')
 const distance = track.offsetHeight - $('.fleet-sticky').offsetHeight
 updateFleet(-track.getBoundingClientRect().top / Math.max(1, distance))
}
addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFromScroll) }, {passive:true})
addEventListener('resize', updateFromScroll)
$$('.scene-steps button').forEach((button) => button.addEventListener('click', () => {
 const p = Number(button.dataset.progress)
 if (mobile.matches || reduced.matches) updateFleet(p)
 else {
  const track = $('.fleet-track')
  const top = track.getBoundingClientRect().top + scrollY
  const distance = track.offsetHeight - $('.fleet-sticky').offsetHeight
  window.scrollTo({top: top + distance * p, behavior:'smooth'})
 }
}))
updateFleet(0)
updateFromScroll()

const decisions = [
 {task:'Execute a program', method:'Shell execution', detail:'Run a command and keep its output and exit status.', source:'https://docs.tangle.tools/sandbox/sdk-reference'},
 {task:'Follow an agent turn', method:'Prompt streaming', detail:'Stream the agent’s events into your application and retain the final result.', source:'https://docs.tangle.tools/sandbox/sdk-reference'},
 {task:'Return to ongoing work', method:'Durable session', detail:'Store the session identifier with your work item so users can return to the same conversation.', source:'https://docs.tangle.tools/sandbox/sdk-reference'},
 {task:'Process independent jobs', method:'Batch execution', detail:'Dispatch independent jobs together and collect a result for each task.', source:'https://docs.tangle.tools/sandbox/sdk-reference'},
 {task:'Coordinate agents', method:'Fleet', detail:'Assign work to multiple agents and collect worker results. Shared artifacts depend on the selected execution driver.', source:'https://docs.tangle.tools/sandbox/sdk-reference'},
]
const briefText = `How should we run agents inside our product?\n\nUse durable sessions for work launched from your application. Store the session identifier with the work item so users can return to it. Use batches for independent jobs and fleets for coordinated work.\n\n${decisions.map((row) => row.task + ': ' + row.method + '. ' + row.detail).join('\n')}\n\nSources\nhttps://docs.tangle.tools/sandbox/sdk-reference\nhttps://docs.tangle.tools/infrastructure/harnesses\nhttps://docs.tangle.tools/platform/authentication`
function renderWorkspace(view = 'brief') {
 $$('.sidebar-item').forEach((button) => button.classList.toggle('selected', button.dataset.workspace === view))
 const target = $('#workspace-document')
 if (view === 'sources') {
  target.innerHTML = `<span class="document-label">Infrastructure research</span><h3>Go to the source.</h3><p class="document-intro">The documentation behind this brief.</p><a class="source-list-link" href="https://docs.tangle.tools/sandbox/sdk-reference" target="_blank" rel="noopener">Sandbox SDK <span>Open docs ↗</span></a><a class="source-list-link" href="https://docs.tangle.tools/infrastructure/harnesses" target="_blank" rel="noopener">Agent support <span>Open docs ↗</span></a><a class="source-list-link" href="https://docs.tangle.tools/platform/authentication" target="_blank" rel="noopener">Authentication <span>Open docs ↗</span></a>`
  return
 }
 if (view === 'files') {
  target.innerHTML = `<span class="document-label">Infrastructure research</span><h3>Keep the work.</h3><p class="document-intro">The brief and its source material.</p><button class="file-row" id="open-brief-file" style="width:100%">▧ research/brief.md <span>Open ↗</span></button><button class="file-row" id="download-brief" style="width:100%">↓ Download brief <span>.md</span></button>`
  $('#open-brief-file').onclick = () => renderWorkspace()
  $('#download-brief').onclick = () => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([briefText],{type:'text/markdown'}));a.download='research-brief.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000) }
  return
 }
 target.innerHTML = `<span class="document-label">Integration brief</span><h3>How should we run agents<br class="desktop"> inside our product?</h3><p class="document-intro">Keep the interface your users know. Choose how their work runs underneath it.</p><div class="decision-table" role="group" aria-label="Choose a task">${decisions.map((row, index) => `<button class="decision-row${index===2?' selected':''}" data-decision="${index}" aria-pressed="${index===2}"><strong>${row.task}</strong><span>${row.method}<b>↗</b></span></button>`).join('')}</div><div class="decision-detail" id="decision-detail" role="status">${decisions[2].detail}</div>`
 $$('.decision-row').forEach((button) => button.onclick = () => {
  $$('.decision-row').forEach((row) => {row.classList.toggle('selected',row===button);row.setAttribute('aria-pressed',String(row===button))})
  $('#decision-detail').textContent = decisions[Number(button.dataset.decision)].detail
 })
}
renderWorkspace()
$$('.sidebar-item').forEach((button) => button.onclick = () => renderWorkspace(button.dataset.workspace))
$('#copy-brief').onclick = () => copy(briefText)
let themeOverride = false
function setWorkspaceTheme(dark) { $('.workspace-shell').classList.toggle('dark',dark);$('#workspace-theme').setAttribute('aria-label',`Switch workspace to ${dark?'light':'dark'} theme`) }
$('#workspace-theme').onclick = () => {themeOverride=true;setWorkspaceTheme(!$('.workspace-shell').classList.contains('dark'))}
const themeObserver = new IntersectionObserver((entries) => {if(entries[0].isIntersecting&&!themeOverride)setWorkspaceTheme(true)}, {threshold:.5})
themeObserver.observe($('.workspace-shell'))
$('#new-research').onclick = () => {
 $('#workspace-document').innerHTML = `<span class="document-label">New research question</span><h3>What do you want<br>to understand?</h3><form class="research-form"><label for="research-question">Your question</label><textarea id="research-question" placeholder="How should we run agents inside our product?" required></textarea><button class="button" type="submit">Copy question ⧉</button></form>`
 $('.research-form').onsubmit = (event) => {event.preventDefault();copy($('#research-question').value)}
 $('#research-question').focus()
}

const flowStatus = ['A question starts the workflow.','Agents read, compare, and prepare the brief.','The brief is ready for your review.','Approved. The brief is ready for your product.']
const flowCaption = ['Start from your application, a webhook, or a schedule.','Independent work runs in parallel. The next step collects its results.','An approval pauses the workflow until a person decides.','Keep the output and its sources together. Run the workflow again when you need it.']
let flowStage = 0
let flowTimer
function fitWorkflow() {
 const canvas=$('.workflow-canvas'), bounds=canvas.getBoundingClientRect()
 const point=(selector,side)=>{const rect=$(selector).getBoundingClientRect();return {x:(side==='right'?rect.right:rect.left)-bounds.left,y:rect.top+rect.height/2-bounds.top}}
 const connect=(from,to)=>{const bend=(from.x+to.x)/2;return `M${from.x} ${from.y}C${bend} ${from.y} ${bend} ${to.y} ${to.x} ${to.y}`}
 const request=point('.flow-request','right'),review=point('.flow-review','left')
 const path=connect(request,point('.flow-browser','left'))+connect(request,point('.flow-code','left'))+connect(point('.flow-browser','right'),review)+connect(point('.flow-code','right'),review)+connect(point('.flow-review','right'),point('.flow-output','left'))
 $('.flow-wires').setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`)
 $$('.flow-wires path').forEach(element=>element.setAttribute('d',path))
}
function setFlow(stage) {
 clearTimeout(flowTimer);flowStage=stage
 $('.workflow-stage').dataset.workflowStage=String(stage)
 $('#workflow-status').textContent=flowStatus[stage]
 $('#workflow-caption').textContent=flowCaption[stage]
 $('#approve-workflow').disabled=stage!==2
 $('#approve-workflow').innerHTML=stage===3?'Approved ✓':'Approve <span>→</span>'
 $('#advance-workflow').innerHTML=['Start the example <span>→</span>','Working <span>↗</span>','Review and approve <span>→</span>','Open the brief <span>↗</span>'][stage]
 $('#advance-workflow').disabled=stage===1
 if(stage===1)flowTimer=setTimeout(()=>setFlow(2),reduced.matches?600:3200)
 requestAnimationFrame(fitWorkflow)
}
$('#advance-workflow').onclick=()=>{if(flowStage===0)setFlow(1);else if(flowStage===2)$('#approve-workflow').focus();else if(flowStage===3){renderWorkspace();$('#products').scrollIntoView({behavior:reduced.matches?'auto':'smooth'})}}
$('#approve-workflow').onclick=()=>{if(flowStage===2)setFlow(3)}
$('#replay-workflow').onclick=()=>setFlow(0)
setFlow(0)
addEventListener('resize',fitWorkflow)

const sourceEvidence = {
 sessions:{title:'Keep a session with the work item.',body:'A session gives your application an identifier it can retain and return to. Choose the session interface when work continues across interactions.',source:'Sandbox SDK · Sessions',url:'https://docs.tangle.tools/sandbox/sdk-reference'},
 fleets:{title:'Coordinate the workers.',body:'Fleets assign work across agents and collect their results. Choose the execution driver to match how your workers need to share artifacts.',source:'Sandbox SDK · Fleets',url:'https://docs.tangle.tools/sandbox/sdk-reference'},
 access:{title:'Connect the products with your Tangle key.',body:'The same account key authenticates requests across Tangle products. Give it the scopes required by your application.',source:'Platform · Authentication',url:'https://docs.tangle.tools/platform/authentication'},
}
function selectEvidence(key) { const item=sourceEvidence[key];$$('[data-evidence]').forEach(button=>button.classList.toggle('selected',button.dataset.evidence===key));$('#evidence-content').innerHTML=`<h4>${item.title}</h4><p>${item.body}</p><a class="source-reference" href="${item.url}" target="_blank" rel="noopener">${item.source}<span>↗</span></a>` }
$$('[data-evidence]').forEach(button=>button.onclick=()=>selectEvidence(button.dataset.evidence))
selectEvidence('sessions')

const codeExamples={interactive:interactiveExample,research:interactiveExample,workflows:researchWorkflowExample,models:examples.models}
let currentCode=interactiveExample
function highlight(code) {
 return code.split('\n').map((line,index)=>{
  const tokens=line.match(/\/\/.*$|'[^']*'|"[^"]*"|\b(?:import|from|const|await|type|new|return)\b|[^'"\s]+|\s+/g)||[]
  const content=tokens.map(token=>{const safe=escapeHtml(token);if(token.startsWith('//'))return `<span class="syntax-comment">${safe}</span>`;if(/^['"]/.test(token))return `<span class="syntax-string">${safe}</span>`;if(/^(import|from|const|await|type|new|return)$/.test(token))return `<span class="syntax-key">${safe}</span>`;return safe}).join('')
  return `<span class="code-line" data-line="${index+1}">${content||' '}</span>`
 }).join('')
}
function openCode(key) {
 currentCode=codeExamples[key]
 $('#code-title').textContent=currentCode.filename
 $('#code-install').textContent=currentCode.install
 $('#code-source').innerHTML=highlight(currentCode.code)
 $('#code-docs').href=key==='models'?'https://docs.tangle.tools/gateway':key==='workflows'?'https://docs.tangle.tools/platform':'https://docs.tangle.tools/sandbox/sdk-reference'
 $('#code-docs').textContent=key==='workflows'?'Workflow docs ↗':'API reference ↗'
 $('#code-dialog').showModal()
}
$$('[data-open-code]').forEach(button=>button.onclick=()=>openCode(button.dataset.openCode))
$('#close-code').onclick=()=>$('#code-dialog').close()
$('#code-dialog').addEventListener('click',event=>{if(event.target===$('#code-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close()}})
$('#copy-code').onclick=()=>copy(currentCode.code)
$('#copy-install').onclick=()=>copy(currentCode.install)
addEventListener('pagehide',()=>{fleet.destroy();clearTimeout(flowTimer);themeObserver.disconnect()})
