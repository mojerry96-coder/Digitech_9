/* Behavioural acceptance checks. Run from the package folder: node tests/verify.cjs */
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const launch=require('./browser.cjs');
const M=require('../src/model.js');
// PREVIEW_ROOT / PREVIEW_PAGE let the same checks run against dist/ builds, including the single-file HTML.
const root=path.resolve(process.env.PREVIEW_ROOT||path.join(__dirname,'..'));
const url=pathToFileURL(path.join(root,process.env.PREVIEW_PAGE||'index.html')).href;
(async()=>{
 const browser=await launch();const page=await browser.newPage({viewport:{width:1366,height:768}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const result=[];const pass=s=>{result.push(s);console.log('PASS',s)};
 const state=()=>page.evaluate(()=>previewDebug.getState());
 const click=a=>page.locator(`[data-action="${a}"]`).first().click();
 const tick=ms=>page.clock.runFor(ms);
 await page.clock.install();await page.goto(url+'?skipintro');
 assert.equal(M.weight(await state()),58);assert.equal((await state()).history.length,0);pass('Fresh start: original lesson, no fabricated run history');
 await click('start');await tick(1100);
 assert.equal((await state()).run.complete,true);assert.equal((await state()).run.elements[0].delay,1050);pass('Office Wi-Fi baseline uses 25 ms/MB');
 await click('test3g');await tick(800);
 let s=await state();assert.equal(s.media[2].loadState,'loaded');assert.equal(s.media[0].loadState,'loading');assert.equal(s.media[1].loadState,'loading');
 assert.equal(await page.locator('.text-block').count(),3);assert.equal(await page.locator('.text-block .load-cover').count(),0);pass('Media loads independently; all three text blocks remain instant');
 await page.locator('[data-connection="wifi"]').click();await tick(1200);
 s=await state();assert.equal(s.run.connection,'wifi');assert.equal(s.run.complete,true);assert.equal(s.history.length,2);pass('Changing conditions cancels an unfinished run safely');
 await click('test3g');await tick(10600);
 s=await state();assert.equal(s.run.elements[0].delay,10500);assert.equal(s.observed3g,true);
 const runCount=s.history.length;
 await page.locator('[data-inspect="video"]').first().click();await click('optimise');
 s=await state();assert.equal(s.media[0].size,6);assert.equal(M.weight(s),22);assert.equal(s.pending,true);assert.equal(s.history.length,runCount);assert.equal(s.run.elements[0].size,42);assert.equal(s.run.elements[0].delay,10500);pass('Optimise changes size without auto-running or overwriting evidence');
 await page.locator('[data-connection="wifi"]').click();await tick(300);
 s=await state();assert.equal(s.run.complete,true);assert.equal(s.pending,true);assert.equal(M.complete(s),false);pass('Automatic condition run does not clear deliberate re-test requirement');
 await click('retest');assert.equal(await page.evaluate(()=>previewDebug.getView()),'observe');await tick(1550);
 s=await state();assert.equal(s.media[0].loadState,'loaded');assert.equal(s.media[1].loadState,'loading');await tick(550);
 s=await state();assert.equal(s.pending,false);assert.equal(M.complete(s),true);assert.equal(s.comparison.before.connection,s.comparison.after.connection);assert.equal(s.comparison.before.device,s.comparison.after.device);assert.equal(s.comparison.before.elements[0].delay,10500);assert.equal(s.comparison.after.elements[0].delay,1500);pass('Deliberate re-test produces the real 10.5 → 1.5 second matching-condition comparison');
 await click('summary');assert.equal(await page.locator('#reflection').inputValue(),'');await page.locator('#reflection').fill('Check video exports before publishing.');assert.equal((await state()).reflection,'Check video exports before publishing.');pass('Summary and optional private reflection work');
 for(const id of ['diagram','photo','pdf']){await page.locator(`[data-inspect="${id}"]`).first().click();await click('optimise');}
 s=await state();assert.equal(M.weight(s),10.3);assert.equal(s.media.filter(m=>m.optimised).length,4);assert.equal(M.complete(s),false);
 await click('retest');await tick(1600);s=await state();assert.equal(M.complete(s),true);assert.deepEqual(s.run.elements.map(e=>e.delay),[1500,500,200,375]);pass('All four media can be optimised; current sizes drive all re-test delays');
 await page.locator('[data-device="mobile"]').click();await tick(1600);await click('summary');await click('repeat');await tick(1600);
 s=await state();assert.equal(s.comparison.before,null);assert.equal(s.comparison.after.device,'mobile');assert.equal(s.run.elements[0].delay,1500);assert.equal(await page.getByText('No matching original run was recorded for this device.',{exact:false}).count(),1);pass('Device width is independent; missing baseline is not fabricated');
 await click('reset');await click('start');await tick(200);await click('reset');await tick(12000);
 s=await state();assert.equal(s.started,false);assert.equal(s.history.length,0);assert.equal(s.reflection,'');assert.equal(s.connection,'wifi');assert.equal(s.device,'desktop');assert.equal(M.weight(s),58);pass('Reset cancels pending callbacks and clears all practice state');
 await page.reload();assert.equal((await state()).started,false);pass('Reload returns to a clean in-memory session');
 await page.clock.uninstall?.();
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768}]){
  await page.setViewportSize(viewport);
  for(const name of ['opening','baseline','observe','diagnose','pending','compare','summary']){
   await page.goto(url+'?reference='+name);await page.evaluate(()=>document.fonts.ready);
   const dims=await page.evaluate(()=>{const deck=document.querySelector('.deck'),lesson=document.querySelector('.lesson-viewport');return {horizontal:document.documentElement.scrollWidth>innerWidth,deckOverflow:deck.scrollHeight-deck.clientHeight,lessonOverflow:lesson.hidden?0:lesson.scrollHeight-lesson.clientHeight};});
   assert.equal(dims.horizontal,false,`${name}: horizontal overflow`);
   assert.ok(dims.deckOverflow<=1,`${viewport.width}x${viewport.height} ${name}: deck overflow ${dims.deckOverflow}`);
   assert.ok(dims.lessonOverflow<=1,`${name}: lesson overflow ${dims.lessonOverflow}`);
  }
  pass(`All seven default states fit ${viewport.width} × ${viewport.height}`);
 }
 for(const width of [375,390]){
  await page.setViewportSize({width,height:844});await page.goto(url+'?reference=diagnose');await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('[data-action="optimise"]').click();assert.equal((await state()).pending,true);
  pass(`${width}px viewport: no horizontal overflow; optimisation works`);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'?reference=observe');
 assert.equal(await page.locator('.load-ring').evaluate(el=>getComputedStyle(el).animationName),'none');pass('Reduced motion removes decorative animation');
 await page.goto(url+'?skipintro');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'skip-link');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'control-deck');pass('Keyboard skip link reaches the controls');
 await page.locator('[data-action="model"]').click();assert.equal(await page.locator('#reference-dialog').evaluate(el=>el.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#reference-dialog').evaluate(el=>el.open),false);pass('Diagnostic reference dialog opens and closes accessibly');
 await page.goto(url+'?skipintro');await page.locator('[data-action="walkthrough"]').click();
 assert.equal(await page.locator('#walkthrough-dialog').evaluate(d=>d.open),true);
 await page.waitForFunction(()=>{const v=document.getElementById('walkthrough-video');return !v.paused&&v.currentTime>0.3;},null,{timeout:6000});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#walkthrough-dialog').evaluate(d=>d.open),false);
 await page.waitForFunction(()=>document.getElementById('walkthrough-video').paused,null,{timeout:2000});
 assert.equal((await state()).started,false);assert.equal((await state()).history.length,0);pass('Walkthrough plays in a closable dialog and does not touch practice state');
 await page.emulateMedia({reducedMotion:'no-preference'}); // the opener's animated stages (reduced motion shows the finished frame at once)
 for(const width of [1440,375]){
  await page.setViewportSize({width,height:width>800?900:812});await page.goto(url);
  // Each stage: where the row is sliding to (its --shift target) must put the arrived logos' centre on the screen centre.
  const offsets=[];
  for(const n of [1,2,3]){
   await page.waitForFunction(k=>document.querySelectorAll('.intro-logo.in').length>=k,n,{timeout:6000});
   offsets.push(await page.evaluate(k=>{const row=document.querySelector('.intro-logos');const ls=[...row.querySelectorAll('.intro-logo')].slice(0,k);
     const restingLeft=row.offsetParent.getBoundingClientRect().left+row.offsetLeft; // offsetLeft ignores the slide transform
     const target=parseFloat(row.style.getPropertyValue('--shift'))||0;
     const left=el=>el.offsetLeft-(el.offsetParent===row?0:row.offsetLeft);
     const mid=(left(ls[0])+left(ls[k-1])+ls[k-1].offsetWidth)/2;
     return Math.abs(restingLeft+target+mid-innerWidth/2);},n));
  }
  await page.waitForFunction(()=>document.querySelector('.intro').classList.contains('st-begin'));await page.waitForTimeout(1000);
  offsets.push(await page.evaluate(()=>{const ls=[...document.querySelectorAll('.intro-logo')].map(l=>l.getBoundingClientRect());return Math.abs((ls[0].left+ls[2].right)/2-innerWidth/2);}));
  assert.ok(offsets.every(o=>o<=2),`${width}px: logo stages off-centre by ${offsets.map(o=>o.toFixed(1)).join(', ')} px`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  pass(`${width}px opener: each logo stage targets the centre and the finished line sits centred (max ${Math.max(...offsets).toFixed(1)} px off)`);
 }
 await page.setViewportSize({width:1366,height:768});
 await page.goto(url);await page.locator('.intro-begin').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>document.getElementById('app').inert),true);
 await page.waitForFunction(()=>document.querySelector('.intro').classList.contains('st-begin'));await page.locator('.intro-begin').click();
 assert.equal(await page.evaluate(()=>document.getElementById('app').inert),false);
 assert.equal(await page.locator('#walkthrough-dialog').evaluate(d=>d.open),true);
 await page.waitForFunction(()=>{const v=document.getElementById('walkthrough-video');return !v.paused&&v.currentTime>0.3;},null,{timeout:6000});
 assert.equal(await page.evaluate(()=>document.getElementById('walkthrough-video').muted),false);
 await page.locator('#wt-skip').click();assert.equal(await page.locator('#walkthrough-dialog').evaluate(d=>d.open),false);
 await page.waitForFunction(()=>document.activeElement.dataset.action==='start',null,{timeout:2000});assert.equal((await state()).started,false);
 pass('Begin plays the narrated walkthrough with sound; Skip hands over to Start Preview');
 await page.locator('[data-action="walkthrough"]').click();
 await page.evaluate(()=>{const v=document.getElementById('walkthrough-video');v.currentTime=v.duration-0.4;});
 await page.locator('#wt-go').waitFor({state:'visible',timeout:5000});assert.equal(await page.evaluate(()=>document.activeElement.id),'wt-go');
 await page.locator('#wt-go').click();assert.equal(await page.locator('#walkthrough-dialog').evaluate(d=>d.open),false);
 await page.waitForFunction(()=>previewDebug.getState().started,null,{timeout:2000});pass('End-card Start Preview is a real button that starts the practice');
 await page.goto(url+'?skipintro');
 await page.locator('[data-action="start"]').click();await page.waitForFunction(()=>previewDebug.getState().run?.complete,null,{timeout:4000});
 await page.locator('[data-action="play-video"]').click();await page.waitForFunction(()=>{const v=document.querySelector('.hero-video');return v&&!v.paused&&v.currentTime>0.3;},null,{timeout:6000});
 assert.equal((await state()).selected,null);pass('Kling hero clip plays only after its simulated load, without opening inspection');
 assert.deepEqual(errors,[]);pass('No browser JavaScript errors');
 console.log(JSON.stringify({passed:result.length,checks:result},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
