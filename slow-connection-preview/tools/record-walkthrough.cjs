/* Record the optional walkthrough (REPLICATION_PROMPT §11) from the real build.
   Frames are captured one at a time while the page clock is advanced by exactly one frame,
   so every on-screen timing is the simulation's own. The cursor, click rings, captions and
   speed badge are drawn in the page during recording only.
   Each step lasts at least as long as its narration line (tools/narration/script.json), so the
   actions wait for the voice. The mixer (tools/mix-walkthrough.sh) places each line at its cue.
   Usage: node tools/record-walkthrough.cjs <framesDir>     (needs playwright; see tests/README.md) */
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const launch = require('../tests/browser.cjs');

const FPS = 30, FRAME = 1000 / FPS;
const root = path.resolve(__dirname, '..');
const url = pathToFileURL(path.join(root, 'index.html')).href + '?skipintro';
const out = path.resolve(process.argv[2] || path.join(root, 'tools/frames'));
const script = JSON.parse(fs.readFileSync(path.join(root, 'tools/narration/script.json'), 'utf8')).lines;
const GAP = 0.45; // silence after each line before the next one starts
fs.mkdirSync(out, { recursive: true });
fs.readdirSync(out).filter(f => f.endsWith('.jpg')).forEach(f => fs.unlinkSync(path.join(out, f)));

const cues = [];            // { start, end, text } in seconds, for the VTT and transcript
let frameNo = 0, cursor = { x: 1500, y: 620 }, openCue = null;

(async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.clock.install();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: `
    #wt-cursor{position:fixed;left:0;top:0;z-index:9999;width:26px;height:26px;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
    #wt-ring{position:fixed;z-index:9998;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #176BFF;opacity:0;pointer-events:none}
    #wt-cap{position:fixed;left:calc((100vw - clamp(380px,31.5vw,530px)) / 2);bottom:118px;transform:translateX(-50%);z-index:9997;width:max-content;max-width:1060px;padding:14px 26px;border-radius:10px;
      background:rgba(11,25,46,.9);color:#fff;font:600 25px/1.4 Manrope,system-ui,sans-serif;letter-spacing:-.2px;text-align:center;opacity:0;pointer-events:none}
    #wt-speed{position:fixed;left:236px;top:86px;z-index:9997;padding:8px 14px;border-radius:6px;background:#0b192e;color:#f1c77f;
      font:700 15px Manrope,system-ui,sans-serif;letter-spacing:.4px;display:none}
    body[data-state=opening] #wt-cap{bottom:auto;top:132px}
    *{caret-color:transparent!important}` });
  await page.evaluate(() => {
    const c = document.createElement('div'); c.id = 'wt-cursor';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l15 11-6.5 1.2L16 21l-2.8 1.3-3.4-6.6L4 20z" fill="#fff" stroke="#0b192e" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    const r = document.createElement('div'); r.id = 'wt-ring';
    const cap = document.createElement('div'); cap.id = 'wt-cap';
    const sp = document.createElement('div'); sp.id = 'wt-speed';
    document.body.append(c, r, cap, sp);
  });

  const t = () => frameNo / FPS;
  const ease = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  async function shot(simMs = FRAME) {
    await page.evaluate(({ x, y }) => { const c = document.getElementById('wt-cursor'); c.style.transform = `translate(${x - 4}px,${y - 2}px)`; }, cursor);
    await page.screenshot({ path: path.join(out, String(frameNo).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    frameNo++;
    await page.clock.runFor(simMs);
  }
  const hold = async (sec, speed = 1) => { for (let i = 0; i < Math.round(sec * FPS); i++) await shot(FRAME * speed); };
  async function caption(text) {
    if (openCue) { openCue.end = t(); cues.push(openCue); }
    openCue = text ? { start: t(), text } : null;
    await page.evaluate(txt => { const c = document.getElementById('wt-cap'); c.textContent = txt || ''; c.style.opacity = txt ? 1 : 0; }, text);
  }
  async function moveTo(selector, sec = 0.7, dx = 0, dy = 0) {
    const box = await page.locator(selector).first().boundingBox();
    const to = { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }, from = { ...cursor };
    const n = Math.max(1, Math.round(sec * FPS));
    for (let i = 1; i <= n; i++) { const k = ease(i / n); cursor = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k }; await shot(); }
  }
  async function click(selector) {
    await moveTo(selector);
    await page.evaluate(({ x, y }) => { const r = document.getElementById('wt-ring'); r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.opacity = 1; r.style.transform = 'scale(.6)'; }, cursor);
    await hold(0.12);
    await page.locator(selector).first().click();
    for (let i = 0; i < 8; i++) {
      await page.evaluate(k => { const r = document.getElementById('wt-ring'); r.style.opacity = 1 - k; r.style.transform = `scale(${0.6 + k})`; }, (i + 1) / 8);
      await shot();
    }
  }
  const speedBadge = on => page.evaluate(v => { const s = document.getElementById('wt-speed'); s.textContent = v || ''; s.style.display = v ? 'block' : 'none'; }, on);

  // One step per narration line: caption on, actions, then hold until the line (plus a short gap) has finished.
  async function step(i, actions) {
    const line = script[i], start = t();
    await caption(line.caption);
    openCue.audio = line.file;
    await actions();
    const left = start + line.duration + GAP - t();
    if (left > 0) await hold(left);
  }

  await hold(0.5);
  // 1. Opening → Office Wi-Fi baseline
  await step(0, async () => { await hold(1.6); await click('[data-action="start"]'); });
  // 2. Simulated 3G: text is instant, media crawls (the 10.5 s run shown at 2×)
  await step(1, async () => {
    await click('[data-action="test3g"]');
    await speedBadge('2× SPEED · 10.5 s RUN');
    await hold(5.3, 2);
    await speedBadge('');
  });
  // 3. Inspect the heaviest file
  await step(2, async () => { await hold(1.2); await click('[data-inspect="video"]'); });
  // 4. Optimise: size changes, nothing re-runs
  await step(3, async () => { await hold(0.6); await click('[data-action="optimise"]'); });
  // 5. Deliberate re-test, real speed
  await step(4, async () => { await click('[data-action="retest"]'); await hold(2.2); });
  // 6. Compare
  await step(5, async () => { await moveTo('.time-comparison .mint', 0.8, 46, 40); });
  // 7. Close
  await step(6, async () => {});
  await hold(0.8);
  await caption(null);

  fs.writeFileSync(path.join(out, 'cues.json'), JSON.stringify({ fps: FPS, frames: frameNo, duration: frameNo / FPS, cues }, null, 2));
  console.log(`${frameNo} frames (${(frameNo / FPS).toFixed(2)} s) → ${out}`);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
