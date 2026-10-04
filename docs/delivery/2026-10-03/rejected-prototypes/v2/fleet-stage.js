const agents = [
 { name: 'Claude Code', command: 'claude', accent: '#dba991', mark: '✳', task: 'Read the documentation.', file: 'research/execution.md', lines: ['Compare shell execution and sessions.', 'Keep source URLs with each finding.', 'Write the integration notes.'] },
 { name: 'Codex', command: 'codex', accent: '#a8d4c4', mark: '›_', task: 'Review the architecture.', file: 'research/architecture.md', lines: ['Compare independent jobs and fleets.', 'Check how results return to the app.', 'Keep the tradeoffs explicit.'] },
 { name: 'Pi', command: 'pi', accent: '#d7c28f', mark: 'π', task: 'Check the agent interfaces.', file: 'research/agents.md', lines: ['Read the supported agent interfaces.', 'Separate the CLI from its model.', 'Keep the choice open.'] },
 { name: 'OpenCode', command: 'opencode', accent: '#a5badb', mark: '▣', task: 'Prepare the research brief.', file: 'research/brief.md', lines: ['Bring the findings together.', 'Check each recommendation’s source.', 'Write a brief the team can use.'] },
]
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n))
const ease = (n) => {const x=clamp(n);return x*x*(3-2*x)}
const lerp = (a,b,t) => a+(b-a)*t
const mix = (a,b,t) => Object.fromEntries(Object.keys(a).map(key=>[key,lerp(a[key],b[key],t)]))

export function createFleetStage(element, {onSelect} = {}) {
 element.innerHTML = `<div class="fleet-root" data-stage="single" data-selected="-1">
  <div class="fleet-scene-bar"><span><img src="knot.svg" alt="Tangle">Interactive sessions</span><span>Interactive example</span></div>
  <div class="fleet-floor" aria-hidden="true"></div><svg class="fleet-wires" aria-hidden="true"><g></g></svg>
  <div class="fleet-terminals">${agents.map((agent,index)=>`<article class="fleet-terminal" role="button" tabindex="0" aria-label="Inspect ${agent.name} terminal" aria-pressed="false" data-agent="${index}" style="--agent-accent:${agent.accent}">
   <div class="fleet-window-bar"><span class="fleet-window-dot"></span><span class="fleet-window-dot"></span><span class="fleet-window-dot"></span><span class="fleet-window-path">/workspace/research</span><span class="fleet-window-expand">↗</span></div>
   <div class="fleet-terminal-content"><div class="fleet-agent-name"><span class="fleet-agent-mark">${agent.mark}</span><strong>${agent.name}</strong><code>${agent.command}</code></div>
   <div class="fleet-assignment"><span>›</span><span>${agent.task}</span></div>
   <div class="fleet-terminal-lines">${agent.lines.map((line,n)=>`<div data-line="${n}"><span>${n===0?'↳':'·'}</span>${line}</div>`).join('')}</div>
   <div class="fleet-file"><span>▱</span>${agent.file}</div>
   </div><div class="fleet-terminal-footer"><img src="knot.svg" alt=""><span>Sandbox terminal</span><span class="fleet-terminal-cursor">▍</span></div>
  </article>`).join('')}</div>
  <aside class="fleet-artifacts"><div class="fleet-artifact-heading"><img src="knot.svg" alt=""><span>Your workspace</span></div><a class="fleet-brief" href="#products"><span>research / brief.md</span><h3>An agent <br>in your product.</h3><div class="fleet-brief-rule"></div><p>Execution.<br>Agent choice.<br>Account access.</p><span>Open the workspace ↗</span></a><a class="fleet-source-link" href="https://docs.tangle.tools/sandbox/sdk-reference" target="_blank" rel="noopener">Source documentation ↗</a></aside>
  <div class="fleet-dispatch"><span class="fleet-prompt-symbol">›</span><span class="fleet-prompt-text">How should we run agents inside our product?</span><span class="fleet-send">↑</span></div>
  <button class="fleet-close" hidden>Back to the fleet <span>↙</span></button>
 </div>`
 const root=element.querySelector('.fleet-root'),windows=[...root.querySelectorAll('.fleet-terminal')],rail=root.querySelector('.fleet-artifacts'),dispatch=root.querySelector('.fleet-dispatch'),wires=root.querySelector('.fleet-wires'),wireGroup=wires.querySelector('g'),close=root.querySelector('.fleet-close')
 const media=matchMedia('(prefers-reduced-motion: reduce)')
 let progress=0,selected=-1,alive=true
 function layout() {
  if(!alive)return
  const width=element.clientWidth,height=element.clientHeight,phone=width<640
  const grid=ease((progress-.15)/.38),collect=ease((progress-.81)/.19)
  root.dataset.stage=progress<.2?'single':progress<.6?'grid':progress<.91?'prompt':'artifacts'
  root.dataset.selected=String(selected)
  root.classList.toggle('fleet-is-mobile',phone)
  root.classList.toggle('fleet-is-focused',selected!==-1)
  close.hidden=selected===-1
  const originalWidth=Math.min(555,width-40),originalHeight=Math.min(350,height-100)
  const poses=[]
  windows.forEach((window,index)=>{
   const col=index%2,row=Math.floor(index/2)
   let pose
   if(phone){
    const first={x:15,y:58,w:width-30,h:Math.min(370,height-118),r:0,z:0}
    const stacked={x:12+(index%2)*5,y:52+index*96,w:width-30,h:88,r:0,z:0}
    pose=mix(first,stacked,grid)
    if(collect>0){const final={x:12,y:52+index*59,w:width-24,h:52,r:0,z:0};pose=mix(pose,final,collect)}
   }else{
    const first={x:(width-originalWidth)/2+index*42,y:65+index*8,w:originalWidth,h:originalHeight,r:index===0?-2:(index-1)*5,z:-index*65}
    const gap=20,pad=27,gridWidth=(width-2*pad-gap)/2,gridHeight=(height-133-gap)/2
    const grouped={x:pad+col*(gridWidth+gap),y:50+row*(gridHeight+gap),w:gridWidth,h:gridHeight,r:0,z:0}
    pose=mix(first,grouped,grid)
    if(collect>0){const railWidth=clamp(width*.25,220,300),area=width-railWidth-35,smallWidth=(area-2*pad-gap)/2;pose=mix(pose,{x:pad+col*(smallWidth+gap),y:50+row*(gridHeight+gap),w:smallWidth,h:gridHeight,r:0,z:0},collect)}
   }
   const visibility=selected===index||index===0?1:ease((progress-(.055+index*.025))/.14)
   if(selected===index)pose={x:phone?10:(width-Math.min(620,width-70))/2,y:phone?58:53,w:phone?width-20:Math.min(620,width-70),h:Math.min(phone?370:380,height-118),r:0,z:100}
   const opacity=selected!==-1&&selected!==index?.19:visibility
   window.style.width=`${pose.w}px`;window.style.height=`${pose.h}px`
   window.style.transform=`translate3d(${pose.x}px,${pose.y}px,${pose.z}px) rotate(${pose.r}deg)`
   window.style.opacity=String(opacity);window.style.zIndex=String(selected===index?20:index===0?8:7-index)
   window.style.pointerEvents=visibility>.1?'auto':'none'
   window.tabIndex=visibility>.1?0:-1
   window.setAttribute('aria-hidden',String(visibility<=.1));window.setAttribute('aria-pressed',String(selected===index))
   window.classList.toggle('fleet-compact',phone&&grid>.8&&selected!==index)
   window.classList.toggle('fleet-mini',phone&&collect>.8&&selected!==index)
   window.classList.toggle('fleet-inspected',selected===index)
   const reveal=selected===index||index===0&&progress<.22?3:Math.floor(clamp((progress-.61)/.22)*3)
   window.querySelectorAll('[data-line]').forEach((line,n)=>{line.style.opacity=n<reveal?'1':'0';line.style.transform=`translateY(${n<reveal?0:4}px)`})
   poses.push(pose)
  })
  rail.style.opacity=String(selected===-1?collect:0)
  rail.style.transform=`translateY(${(1-collect)*25}px)`
  rail.style.pointerEvents=collect>.9&&selected===-1?'auto':'none'
  rail.setAttribute('aria-hidden',String(collect<.9||selected!==-1))
  rail.querySelectorAll('a').forEach(a=>a.tabIndex=collect>.9&&selected===-1?0:-1)
  dispatch.style.opacity=String(selected===-1?lerp(.45,1,ease((progress-.5)/.15)):.15)
  const signal=clamp((progress-.62)/.09)*clamp((.93-progress)/.06)
  wires.style.opacity=String(selected===-1&&!phone?signal*.55:0)
  wires.setAttribute('viewBox',`0 0 ${width} ${height}`)
  wireGroup.innerHTML=poses.map(pose=>`<path d="M${width/2} ${height-44}C${width/2} ${height-85} ${pose.x+pose.w/2} ${pose.y+pose.h+38} ${pose.x+pose.w/2} ${pose.y+pose.h}"/>`).join('')
 }
 function selectAgent(index){selected=selected===index?-1:clamp(index,0,3);layout();if(selected!==-1)onSelect?.(selected)}
 windows.forEach((window,index)=>{
  window.addEventListener('click',()=>selectAgent(index))
  window.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key===' '){event.preventDefault();selectAgent(index)}
   if(event.key==='Escape'){selected=-1;layout()}
   if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(event.key)){event.preventDefault();const visible=windows.filter(item=>item.tabIndex===0),current=visible.indexOf(window),direction=event.key==='ArrowRight'||event.key==='ArrowDown'?1:-1;visible[(current+direction+visible.length)%visible.length]?.focus()}
  })
 })
 close.onclick=()=>{const prior=selected;selected=-1;layout();windows[prior]?.focus()}
 const resize=new ResizeObserver(layout);resize.observe(element)
 media.addEventListener('change',layout)
 layout()
 return {setProgress(p){const next=clamp(p);if(Math.abs(next-progress)>.07)selected=-1;progress=next;layout()},selectAgent,destroy(){alive=false;resize.disconnect();media.removeEventListener('change',layout)}}
}
