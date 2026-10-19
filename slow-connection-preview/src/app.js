/* Shared controller and rendering. The seven reference pages are states, not routes. */
const M = window.PreviewModel;
let state = M.initialState();
let timers = [], nextRunId = 0, runToken = 0;
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iconPaths = {
  play:'<path d="m8 4 12 8-12 8Z"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  file:'<path d="M6 3h8l4 4v14H6Z M14 3v5h4 M9 13h6 M9 17h5"/>',
  desktop:'<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M12 17v4M8 21h8"/>',
  tablet:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/>',
  mobile:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  text:'<path d="M4 5h16M4 10h16M4 15h11M4 20h7"/>',
  signal:'<path d="M5 20v-4M10 20V12M15 20V8M20 20V4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7v.1"/>',
  pause:'<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>'
};
function icon(name,cl=''){return `<svg class="icon ${cl}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.info}</svg>`;}
function announce(message){$('announcer').textContent=message;}
/* Hero video: a real Kling 3.0 clip. One element lives for the whole session and is moved into each
   re-rendered slot, so playback is never reset by a render. It plays only after its simulated load. */
let heroPlaying=false;
const heroVideo=document.createElement('video');
Object.assign(heroVideo,{muted:true,loop:false,playsInline:true,preload:'none',poster:'assets/river-lesson.jpg'});
heroVideo.className='hero-video';
heroVideo.setAttribute('aria-hidden','true');
heroVideo.innerHTML='<source src="assets/media/river-lesson.mp4" type="video/mp4"><source src="assets/media/river-lesson.webm" type="video/webm">';
['pause','ended'].forEach(e=>heroVideo.addEventListener(e,()=>{if(heroPlaying){heroPlaying=false;render();}}));
function stopHero(){heroPlaying=false;heroVideo.pause();try{heroVideo.currentTime=0;}catch(e){}}
function toggleHero(){
  if(state.media[0].loadState!=='loaded')return;
  if(heroPlaying){heroPlaying=false;heroVideo.pause();}
  else{heroPlaying=true;if(heroVideo.ended)heroVideo.currentTime=0;heroVideo.play().catch(()=>{heroPlaying=false;render();});}
  render();
}
/* Opening background: a second Kling 3.0 clip. Plays once, muted, with a visible pause control. */
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function syncOpeningButton(){
  const v=$('opening-video'),b=$('opening-motion');if(!v||!b)return;
  const playing=!v.paused&&!v.ended;
  b.setAttribute('aria-label',playing?'Pause background video':'Play background video');
  b.querySelector('span').textContent=playing?'Pause':'Play';
  b.querySelector('svg').innerHTML=iconPaths[playing?'pause':'play'];
}
function playOpening(){const v=$('opening-video');if(!v||reduceMotion||state.started)return;if(v.ended)v.currentTime=0;v.play().catch(()=>{}).finally(syncOpeningButton);}
function toggleOpening(){const v=$('opening-video');if(!v.paused&&!v.ended){v.pause();}else{if(v.ended)v.currentTime=0;v.play().catch(()=>{});}}
const networkName = value => value==='3g'?'Simulated 3G':'Office Wi-Fi';
const deviceName = value => value[0].toUpperCase()+value.slice(1);
function visualState(){
  if(!state.started) return 'opening';
  if(state.panel==='summary') return 'summary';
  if(state.selected && !state.pending) return 'diagnose';
  if(state.run && !state.run.complete) return 'observe';
  if(state.pending) return 'pending';
  if(state.comparison && state.comparison.after.id===state.run?.id) return 'compare';
  return state.connection==='wifi'?'baseline':'observe';
}
function cancelRun(){timers.forEach(clearTimeout);timers=[];runToken++;}
function runTest(intent){
  cancelRun();
  state.started=true;state.panel=null;state.selected=null;state.comparison=null;
  stopHero();$('opening-video')?.pause();
  const token=runToken;
  const run=M.makeRun(state,intent,++nextRunId);
  state.run=run;
  state.media.forEach(m=>m.loadState='loading');
  render();
  announce(`Testing on ${networkName(run.connection)}, ${deviceName(run.device)}.`);
  run.elements.forEach(el=>{
    timers.push(setTimeout(()=>{
      if(token!==runToken)return;
      el.status='loaded';
      state.media.find(m=>m.id===el.id).loadState='loaded';
      announce(`${el.name} loaded in ${M.formatTime(el.delay)}.`);
      if(run.elements.every(e=>e.status==='loaded')) finishRun(run);
      render();
    },el.delay));
  });
}
function finishRun(run){
  run.complete=true;
  const snapshot=JSON.parse(JSON.stringify(run));
  const key=M.conditionKey(run.connection,run.device);
  if(run.revision===0 && !state.baseline[key])state.baseline[key]=snapshot;
  if(run.connection==='3g')state.observed3g=true;
  state.history.push(snapshot);
  // Automatic condition runs never discharge the explicit re-test requirement.
  if(run.intent==='retest' && run.connection==='3g' && state.media.some(m=>m.optimised)){
    state.pending=false;
    state.verifiedRevision=run.revision;
    const before=state.baseline[key];
    state.comparison={before:before||null,after:snapshot};
  }
  announce('Run complete. Select media to inspect its loading evidence.');
}
function optimise(id){
  const media=state.media.find(m=>m.id===id);
  if(!media || media.optimised || !state.observed3g || !state.run?.complete)return;
  const before=media.size;
  media.size=media.target;media.optimised=true;
  state.revision++;state.pending=true;state.panel=null;state.comparison=null;
  state.traces.push({id,name:media.name,before,after:media.size,revision:state.revision,reason:media.approach});
  if(!state.selectedBottlenecks.includes(id))state.selectedBottlenecks.push(id);
  render();
  announce(`${media.name} optimised from ${before} to ${media.size} MB. Re-test required.`);
  document.querySelector('[data-action="retest"]')?.focus({preventScroll:true});
}
function selectMedia(id){
  if(!state.started)return;
  state.selected=id;state.panel=null;
  render();
  $('inspection-title')?.focus({preventScroll:true});
}
function mediaMarkup(media,content,className=''){
  const runEl=state.run?.elements.find(e=>e.id===media.id);
  const loading=media.loadState==='loading';
  return `<button class="media-object ${className} ${loading?'is-loading':''} ${state.selected===media.id?'is-selected':''}" data-inspect="${media.id}" aria-label="Inspect ${esc(media.name)}, ${M.formatMB(media.size)} MB${loading?', loading':''}" aria-pressed="${state.selected===media.id}">
    <span class="media-content">${content}</span>
    ${loading?`<span class="load-cover"><span class="load-ring" aria-hidden="true"></span><strong>${esc(media.name)}</strong><span>Loading · ${M.formatMB(runEl?.size??media.size)} MB</span></span>`:''}
    <span class="media-tag">${esc(media.name)} <span>· ${M.formatMB(media.size)} MB</span>${media.optimised?icon('check'):''}</span>
    <span class="inspect-hint">Inspect ${icon('arrow')}</span>
  </button>`;
}
function renderLesson(){
  const [video,diagram,photo,pdf]=state.media;
  $('device-label').innerHTML=icon(state.device)+deviceName(state.device);
  $('lesson-viewport').dataset.device=state.device;
  $('lesson').innerHTML=`<div class="lesson-title"><span class="eyebrow">SCIENCE / LESSON 04</span><h1>Understanding the water cycle</h1></div>
    <div class="hero-wrap${heroPlaying?' is-playing':''}">${mediaMarkup(video,`<span class="hero-slot"></span><span class="play-disc" aria-hidden="true">${icon('play')}</span>`,'hero-media')}${video.loadState==='loaded'?`<button class="clip-control" data-action="play-video" aria-label="${heroPlaying?'Pause':'Play'} the hero video clip">${icon(heroPlaying?'pause':'play')}<span>${heroPlaying?'Pause':'Play clip'}</span></button>`:''}</div>
    <div class="text-block intro-text"><strong>Water is always moving.</strong> It travels between the land, the oceans and the atmosphere.</div>
    <div class="secondary-media">${mediaMarkup(diagram,'<img src="assets/water-cycle.svg" alt="Water cycle: evaporation, condensation, precipitation and collection">','diagram-media')}${mediaMarkup(photo,'<img src="assets/rain-photo.jpg" alt="Raindrops on a window with green trees beyond">','photo-media')}</div>
    <div class="lesson-text-pair"><p class="text-block"><strong>Powered by the Sun.</strong> Heat turns liquid water into vapour.</p><p class="text-block"><strong>Returning as rain.</strong> Water collects and the cycle continues.</p></div>
    <button class="pdf-object ${pdf.loadState==='loading'?'pdf-loading':''} ${state.selected==='pdf'?'is-selected':''}" data-inspect="pdf" aria-label="Inspect PDF handout, ${M.formatMB(pdf.size)} MB">${icon('file')}<span><strong>The water cycle</strong><small>PDF handout · ${M.formatMB(pdf.size)} MB</small></span><span class="pdf-state">${pdf.loadState==='loading'?'Loading…':icon('arrow')}</span></button>`;
}
function renderLog(compact=false){
  const run=state.run;
  if(!run)return '';
  const changed=state.pending?' · before changes':'';
  const rows=`<div class="log-rows">${run.elements.map(el=>`<button class="log-row ${state.selected===el.id?'active':''}" data-inspect="${el.id}" aria-label="Inspect ${esc(el.name)} from latest run"><span class="log-icon">${icon(M.MEDIA.find(m=>m.id===el.id).icon)}</span><span class="log-name">${esc(el.name)}<small>${M.formatMB(el.size)} MB</small></span><span class="log-status ${el.status}">${el.status==='loading'?'<span class="small-spinner"></span> Loading':M.formatTime(el.delay)+' '+icon('check')}</span></button>`).join('')}<div class="log-row text-log"><span class="log-icon">${icon('text')}</span><span class="log-name">Text blocks<small>3 blocks</small></span><span class="log-status loaded">Instant ${icon('check')}</span></div></div>`;
  const status=`<span class="run-status ${run.complete?'done':''}"><i></i>${run.complete?'Complete':'Loading'}</span>`;
  return compact?`<details class="compact-log"><summary>Latest run${changed}${status}</summary>${rows}</details>`:`<section class="log-section"><div class="section-label"><span>Latest run${changed}</span>${status}</div>${rows}</section>`;
}
function renderMetrics(){return `<div class="metrics"><div><span>Lesson weight</span><strong>${M.formatMB(M.weight(state))}<small> MB</small></strong></div><div><span>Optimised</span><strong>${state.media.filter(m=>m.optimised).length}<small> of 4</small></strong></div></div>`;}
function renderOpening(){return `<div class="welcome-content"><div class="welcome-illustration">${icon('desktop')}<span></span>${icon('signal')}</div><p>Test a sample lesson on Wi-Fi and 3G. Find the heavy media, then check your changes.</p><div class="welcome-baseline"><span>Starting conditions</span><strong>Office Wi-Fi <span>·</span> Desktop</strong><small>4 media files · 3 text blocks</small></div><button class="text-button wt-link" data-action="walkthrough">${icon('play')}Watch the walkthrough · 45 s</button></div>`;}
function renderInspection(){
  const media=state.media.find(m=>m.id===state.selected);
  if(!media)return '';
  const timing=state.run?.elements.find(e=>e.id===media.id);
  return `<section class="inspection"><div class="inspection-top"><span class="selection-label">SELECTED MEDIA</span><button class="icon-button" data-action="close-inspection" aria-label="Close media inspection">×</button></div><h3 id="inspection-title" tabindex="-1">${esc(media.name)}</h3><div class="inspection-size">${M.formatMB(media.size)}<span> MB</span></div><p>${esc(media.optimised?media.approach:media.note)}</p><div class="detail-pair"><span>Last measured load</span><strong>${timing?.status==='loaded'?M.formatTime(timing.delay):'Loading…'}</strong></div><div class="detail-pair"><span>${media.optimised?'Current size':'Suggested export'}</span><strong>${M.formatMB(media.target)} MB</strong></div><small class="clarity-note">${esc(media.approach)}</small></section>`;
}
function renderPending(){
  const change=state.traces[state.traces.length-1];
  const selected=state.media.find(m=>m.id===state.selected);
  if(selected && !selected.optimised)return renderInspection()+`<div class="pending-inline">Re-test required for saved changes</div>`;
  return `<section class="change-confirmation"><span class="soft-check">${icon('check')}</span><h3>${esc(change.name)} optimised</h3><div class="size-change"><span>${M.formatMB(change.before)}<small> MB</small></span>${icon('arrow')}<strong>${M.formatMB(change.after)}<small> MB</small></strong></div><p>Appearance preserved.</p><div class="pending-inline"><span class="amber-dot"></span>Re-test required</div><small>Latest timings still belong to the previous run.</small></section>`;
}
function renderComparison(){
  const c=state.comparison;
  if(!c)return '';
  if(!c.before)return `<section class="comparison"><span class="selection-label">RE-TEST COMPLETE</span><h3>${deviceName(c.after.device)} · ${networkName(c.after.connection)}</h3><p>No matching original run was recorded for this device. The latest timings are shown below.</p></section>`;
  const changed=c.after.elements.filter(el=>el.size<c.before.elements.find(b=>b.id===el.id).size);
  const chosen=changed.find(e=>e.id==='video')||changed[0];
  const before=c.before.elements.find(e=>e.id===chosen.id);
  return `<section class="comparison"><span class="selection-label">${deviceName(c.after.device).toUpperCase()} · SIMULATED 3G</span><h3>${esc(chosen.name)} loads faster</h3><div class="time-comparison"><div><span>Before</span><strong>${M.formatTime(before.delay)}</strong></div>${icon('arrow')}<div><span>After</span><strong class="mint">${M.formatTime(chosen.delay)}</strong></div></div><div class="load-bars" aria-hidden="true"><i style="width:100%"></i><i style="width:${Math.max(2,chosen.delay/before.delay*100)}%"></i></div><small>${M.formatMB(before.size)} MB → ${M.formatMB(chosen.size)} MB · same lesson appearance</small></section>`;
}
function renderSummary(){
  const latest=state.history[state.history.length-1];
  return `<section class="summary"><div class="summary-status">${icon('check')} Practice cycle complete</div><div class="summary-weight"><span>Lesson weight</span><div><span>58<small> MB</small></span>${icon('arrow')}<strong>${M.formatMB(M.weight(state))}<small> MB</small></strong></div></div><div class="summary-facts"><span>Optimised files<strong>${state.media.filter(m=>m.optimised).length} of 4</strong></span><span>Last conditions<strong>${deviceName(latest.device)} · ${networkName(latest.connection)}</strong></span></div><div class="summary-changes">${state.traces.map(t=>`<div><span>${esc(t.name)}</span><strong>${M.formatMB(t.before)} → ${M.formatMB(t.after)} MB</strong></div>`).join('')}</div><details class="history"><summary>Run history <span>${state.history.length} completed</span></summary><ol>${state.history.map(r=>`<li><strong>${networkName(r.connection)} · ${deviceName(r.device)}</strong><span>${M.formatMB(r.total)} MB · ${r.intent==='retest'?'Deliberate re-test':'Condition run'}</span><small>${r.elements.map(e=>`${e.name}: ${M.formatTime(e.delay)}`).join(' · ')}</small></li>`).join('')}</ol></details><label class="reflection-label" for="reflection">What will you check in your own lesson?<span>Optional · private to this session</span></label><textarea id="reflection" maxlength="400" rows="2" placeholder="One thing to check before publishing…">${esc(state.reflection)}</textarea><p class="summary-reminder">Keep lesson clarity part of every decision.</p></section>`;
}
function renderFooter(view){
  let action='',help='';
  if(view==='opening'){action=primary('start','Start Preview');help='Untimed practice. No score.';}
  else if(view==='summary'){action=primary('repeat','Re-test on Simulated 3G');help='<button class="text-button" data-action="reset">Reset lesson</button>';}
  else if(state.run && !state.run.complete){action=primary('wait','Test in progress',true);help='Select a media object to inspect it.';}
  else if(state.selected && !state.media.find(m=>m.id===state.selected).optimised){
    if(state.observed3g)action=primary('optimise','Optimise '+state.media.find(m=>m.id===state.selected).name.toLowerCase());
    else {action=primary('test3g','Test on Simulated 3G');help='Observe a constrained run before optimising.';}
  }
  else if(state.pending){action=primary('retest','Re-test on Simulated 3G');help='Select another file to make more changes.';}
  else if(M.complete(state)){action=primary('summary','Review Summary');help='Inspect another file or review your changes.';}
  else if(state.connection==='wifi'){action=primary('test3g','Test on Simulated 3G');help='Switch connection to observe the difference.';}
  else {action='';help='Select the media you would change in the lesson or log.';}
  return `<div class="footer-hint">${help}</div>${action}<button class="model-reference" data-action="model">${icon('info')} Simulated model <span>How timings work</span></button>`;
}
function primary(action,label,disabled=false){return `<button class="primary" data-action="${action}" ${disabled?'disabled':''}>${label}${disabled?'':icon('arrow')}</button>`;}
function render(){
  const focus=document.activeElement;
  const focusKey=focus?.dataset.action?`[data-action="${focus.dataset.action}"]`:focus?.dataset.inspect?`[data-inspect="${focus.dataset.inspect}"]`:null;
  const view=visualState();document.body.dataset.state=view;
  $('opening').hidden=state.started;
  $('lesson-viewport').hidden=!state.started;
  $('condition-controls').hidden=!state.started;
  const cfg=PreviewStates[view];
  $('state-title').textContent=cfg.title;
  $('state-subtitle').textContent=view==='observe' && state.connection==='wifi'?'Loading the Office Wi-Fi baseline.':cfg.subtitle;
  document.querySelectorAll('[data-connection]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.connection===state.connection)));
  document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.device===state.device)));
  renderLesson();
  document.querySelector('.hero-slot')?.replaceWith(heroVideo);
  const api={opening:renderOpening,log:renderLog,metrics:renderMetrics,inspection:renderInspection,pending:renderPending,comparison:renderComparison,summary:renderSummary};
  $('deck-content').innerHTML=cfg.render(api);
  $('deck-footer').innerHTML=renderFooter(view);
  if(focusKey && focus!==document.body)document.querySelector(focusKey)?.focus({preventScroll:true});
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button || button.disabled)return;
  if(button.dataset.connection){state.connection=button.dataset.connection;runTest('connection');return;}
  if(button.dataset.device){state.device=button.dataset.device;if(state.started)runTest('device');else render();return;}
  if(button.dataset.inspect){selectMedia(button.dataset.inspect);return;}
  switch(button.dataset.action){
    case 'start':runTest('baseline');break;
    case 'test3g':state.connection='3g';runTest('connection');break;
    case 'retest':case 'repeat':state.connection='3g';runTest('retest');break;
    case 'optimise':optimise(state.selected);break;
    case 'close-inspection':state.selected=null;render();break;
    case 'summary':if(M.complete(state)){state.selected=null;state.panel='summary';render();$('state-title').setAttribute('tabindex','-1');$('state-title').focus({preventScroll:true});}break;
    case 'reset':cancelRun();stopHero();state=M.initialState();nextRunId=0;render();if($('opening-video')){$('opening-video').currentTime=0;syncOpeningButton();}announce('Lesson reset. Office Wi-Fi and Desktop restored.');break;
    case 'model':$('reference-dialog').showModal();break;
    case 'play-video':toggleHero();break;
    case 'walkthrough':openWalkthrough(false);break;
    case 'wt-unmute':{const v=$('walkthrough-video');v.muted=false;$('wt-unmute').hidden=true;v.focus();break;}
    case 'wt-go':wtGo=true;$('walkthrough-dialog').close();break;
    case 'opening-motion':toggleOpening();break;
  }
});
document.addEventListener('input',event=>{if(event.target.id==='reflection')state.reflection=event.target.value;});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && !$('reference-dialog').open && state.selected){state.selected=null;render();}});

/* Reproducible design fixtures. These are static references, never live test evidence.
   Activated only with ?reference=opening|baseline|observe|diagnose|pending|compare|summary.
   No debug controls are present in the learner interface. */
function loadReference(name){
  cancelRun();state=M.initialState();
  if(name==='opening')return;
  state.started=true;state.connection='wifi';
  const snapshot=(connection,intent,id)=>{state.connection=connection;let r=M.makeRun(state,intent,id);r.complete=true;r.elements.forEach(e=>e.status='loaded');return r;};
  const wifi=snapshot('wifi','baseline',1);
  state.history=[wifi];state.run=wifi;state.baseline['wifi:desktop']=wifi;
  state.media.forEach(m=>m.loadState='loaded');
  if(name==='baseline')return;
  const before=snapshot('3g','connection',2);state.run=before;
  if(name==='observe') {state.run.complete=false;state.run.elements[0].status='loading';state.media[0].loadState='loading';return;}
  state.history.push(before);state.baseline['3g:desktop']=JSON.parse(JSON.stringify(before));state.observed3g=true;state.selected='video';
  if(name==='diagnose')return;
  state.media[0].size=6;state.media[0].optimised=true;state.revision=1;state.pending=true;state.selectedBottlenecks=['video'];state.traces=[{id:'video',name:'Hero video',before:42,after:6,revision:1,reason:M.MEDIA[0].approach}];
  if(name==='pending')return;
  state.selected=null;const after=snapshot('3g','retest',3);state.run=after;state.history.push(after);state.pending=false;state.verifiedRevision=1;state.comparison={before:state.baseline['3g:desktop'],after};
  if(name==='summary')state.panel='summary';
}
const reference=new URLSearchParams(location.search).get('reference');
if(reference && Object.hasOwn(PreviewStates,reference))loadReference(reference);
render();
// Read-only snapshots support acceptance tests without changing the learner's state.
['play','pause','ended'].forEach(e=>$('opening-video')?.addEventListener(e,syncOpeningButton));
document.addEventListener('visibilitychange',syncOpeningButton);
/* Walkthrough player (house pattern). Begin opens it with sound; if the browser still blocks sound it plays
   muted with captions and offers Turn on sound. Skip / Esc close it at any time. At the end a real
   Start Preview button hands over. Watching never changes the practice state. */
let wtAuto=false,wtGo=false;
function openWalkthrough(auto){
  const d=$('walkthrough-dialog'),v=$('walkthrough-video');
  wtAuto=auto;wtGo=false;
  $('opening-video')?.pause();
  $('wt-go').hidden=true;$('wt-unmute').hidden=true;
  $('wt-skip').firstChild.textContent=auto?'Skip to practice ':'Close ';
  if(!d.open)d.showModal();
  v.currentTime=0;v.muted=false;
  v.play().catch(()=>{v.muted=true;$('wt-unmute').hidden=false;v.play().catch(()=>{});});
  $(auto?'wt-skip':'walkthrough-video').focus({preventScroll:true});
}
$('walkthrough-video')?.addEventListener('ended',()=>{$('wt-go').hidden=false;$('wt-go').focus({preventScroll:true});});
$('walkthrough-dialog')?.addEventListener('cancel',()=>$('walkthrough-video').pause());
$('walkthrough-dialog')?.addEventListener('close',()=>{
  $('walkthrough-video').pause();$('wt-go').hidden=true;
  if(wtGo&&!state.started){runTest('baseline');$('control-deck').focus({preventScroll:true});return;}
  if(!state.started)playOpening();
  document.querySelector(wtAuto?'[data-action="start"]':'[data-action="walkthrough"]')?.focus({preventScroll:true});
});
// If the clip cannot load, the poster stands alone and the motion control is removed.
{const srcs=[...($('opening-video')?.querySelectorAll('source')||[])];let failed=0;srcs.forEach(s=>s.addEventListener('error',()=>{if(++failed===srcs.length)$('opening-motion').hidden=true;}));}
window.SlowPreview={start(focusStart=true,opts={}){$('app').removeAttribute('inert');if(opts.walkthrough){openWalkthrough(true);return;}playOpening();if(focusStart)document.querySelector('[data-action="start"]')?.focus({preventScroll:true});}};
window.previewDebug={getState:()=>JSON.parse(JSON.stringify(state)),getView:visualState};
