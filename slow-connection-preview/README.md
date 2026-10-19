# Slow Connection Preview (rebuild)

DT01 · DT 05 04, *Previewing Your Own Lesson Under a Simulated 3G Connection*. Rebuilt on 19 Oct 2026 from `Slow_Connection_Preview_Replication_Package.zip`, which is now the design authority: one persistent page in seven visual states, with a light Lesson Preview Frame on the left and a navy Control Deck on the right.

The previous DevTools-replica build is kept, unchanged, in `../_archive/slow-connection-preview-devtools-v1/` locally. It is not in the public repo.

## Deliverables

```bash
node tools/build-dist.mjs
```

This builds three things in `dist/`:

| Output | What it is |
|---|---|
| `Slow_Connection_Preview/` | The runnable app (runtime files only), `START_HERE.txt` and `docs/`: the README, QA report, asset provenance, walkthrough transcript and replication prompt |
| `Slow_Connection_Preview.zip` | The same folder, zipped (16.6 MB) |
| `slow-connection-preview.html` | A single self-contained file (15.7 MB) with every script, style, font, image and video embedded (MP4 only). It opens offline from anywhere. |

The full test suite also runs against the builds:

```bash
PREVIEW_ROOT=dist/Slow_Connection_Preview node tests/verify.cjs
PREVIEW_ROOT=dist PREVIEW_PAGE=slow-connection-preview.html node tests/verify.cjs
```

## Run it

```bash
node tools/serve.mjs 8095
```

Then open http://127.0.0.1:8095. The server supports range requests, so the videos can seek. Opening `index.html` straight from disk also works.

| URL option | Effect |
|---|---|
| `?skipintro` | Skips the house opener and the walkthrough |
| `?nowalk` | Plays the opener, but Begin goes straight to the opening state |
| `?reference=opening\|baseline\|observe\|diagnose\|pending\|compare\|summary` | Static design fixture for review (also skips the opener). Never used in normal play. |

## What changed from the package

The package's code, model, seven state renderers, copy and timing rules are used as supplied. The additions are:

1. **House opener first.** The storyboard's flow starts with the "Miva University opening", so the partner-logo opener from `Fix_the_Prompt_Opener.zip` plays before the package's 01 Opening state. The rest of the app is `inert` until **Begin**.
2. **Real MIVA logo** in the topbar, replacing the text wordmark (REPLICATION_PROMPT §10).
3. **New imagery (Nano Banana Pro, 4K):**
   - a sunlit river for the hero video
   - a misty sunrise river for the opening
   - raindrops on glass for the photo

   The diagram stays code-native SVG.
4. **Real video (Kling 3.0, pro, 10 s, silent):**
   - **Hero video.** The lesson's hero is now an actual clip, so the old "still image pretending to be a video" limitation is gone.
     - It can only play once its *simulated* load has finished: on 3G it stays behind the loading cover for 10.5 s before 42 MB, or 1.5 s after optimising to 6 MB.
     - Playback is a separate **Play clip** control in the hero's top-right corner. Clicking anywhere else on the hero still means **Inspect**, as the spec requires.
     - The centred play disc is decorative, as in the package.
     - One video element lives for the whole session, so re-renders never restart it. Any new run stops it and resets it to the start.
   - **Opening background.** The 01 Opening state plays a slow aerial push-in once, muted, with a visible **Pause / Play** control (WCAG 2.2.2). With reduced motion it does not autoplay. If the clip fails to load, the poster stands alone and the control is removed.
5. **Narrated walkthrough (REPLICATION_PROMPT §11).** A 44.6 s recording of the real build: baseline → 3G → inspect → optimise → explicit re-test → matching-condition comparison.
   - **Voice:** ElevenLabs "Ifeoma Odumodu – Nigerian Narrator" (`reGkImJki7uJOve2F4A0`), `eleven_multilingual_v2`, stability 0.6, similarity 0.8. This is the house narrator and settings used across the DigiTech builds.
   - **Narration files:** seven lines, one file each, in `tools/narration/`. The text is in `script.json`.
   - **Timing:** `tools/record-walkthrough.cjs` advances the page clock one frame at a time, and each step lasts at least as long as its spoken line, so the actions wait for the voice. The 10.5 s 3G run is shown at 2× speed, with a "2× SPEED · 10.5 s RUN" badge on screen. The re-test plays at real speed.
   - **Captions:** burned in and matching the spoken words (numbers shown as numerals), plus `captions.vtt` and `transcript.md`, as the package requires for spoken audio.
   - **Mixing:** `tools/mix-walkthrough.cjs` places each line at its cue, normalises to −16 LUFS and writes the MP4 (H.264/AAC) and WebM (VP9/Opus).
   - **Begin plays it first (house pattern):**
     - Begin counts as the click browsers require for audio, so it plays with sound. If a browser still blocks sound, it plays muted with captions and shows **Turn on sound**.
     - **Skip to practice** or Esc closes it at any time and lands on **Start Preview**.
     - At the end, a real **Start Preview** button over the final frame starts the practice.
     - **Watch the walkthrough · 45 s** on the opening state replays it later.
     - Watching never changes the practice state. `?nowalk` makes Begin go straight to the opening state.
   - **Changing a line:** regenerate its `nN.mp3` with the same voice settings, update `script.json`, then re-record and re-mix. The timings follow the new audio.
6. **Test harness portability.** `tests/browser.cjs` uses its low-memory Chromium flags on Linux only, because they crash Chrome on macOS. `tests/verify.cjs` gained six checks: Begin → walkthrough with sound → Skip lands on Start Preview; the end-card Start Preview starts the practice; the walkthrough dialog leaves the practice state untouched; the Kling clip plays only after its simulated load without opening inspection; and the opener's logo stages centre correctly at 1440 px and 375 px.
7. **Opener alignment fix.** `centreOn()` in `src/intro.js` now measures the logos and the row from the row's own left edge. Before, the finished logo line sat 146 px right of centre in current Chrome (see QA_REPORT.md).

Provenance, prompts and job IDs for every generated asset are in `assets/ASSET_PROMPTS.md`.

## Files

| Path | What it is |
|---|---|
| `index.html` | House opener and the persistent shell |
| `src/model.js`, `src/states.js` | Package model and the seven state renderers (unchanged) |
| `src/app.js` | Package controller, plus the hero/opening video plumbing and the opener hook |
| `src/styles.css` | Package styles, plus a short "Rebuild additions" block at the end |
| `src/intro.css`, `src/intro.js` | House opener |
| `assets/` | Generated stills, `media/` (Kling clips), fonts, logos, the SVG diagram |
| `references/` | 1920 × 1080 exports of this build (01–07), plus responsive checks (08–10) |
| `references-package/` | The package's original reference images, for comparison |
| `spec/`, `REPLICATION_PROMPT.md` | Package specification, unchanged. The supplied storyboard PDF and design guide (`source-documents/`) are kept locally, not in the public repo. |
| `reference-gallery.html` | Developer gallery of the reference states |
| `walkthrough/` | Narrated walkthrough (MP4/WebM, poster, VTT, transcript) |
| `tools/record-walkthrough.cjs`, `tools/mix-walkthrough.cjs`, `tools/narration/` | Re-record and re-mix the walkthrough; narration lines and script |
| `tests/` | Verification suite and the reference exporter |

## Verify

```bash
npm install --no-save playwright
PREVIEW_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node tests/verify.cjs
node tests/export-references.cjs
node tools/record-walkthrough.cjs /tmp/wt-frames
node tools/mix-walkthrough.cjs /tmp/wt-frames      # narration mix, MP4/WebM, poster, VTT, transcript
```

The results of the latest run are in `QA_REPORT.md`.

## Boundaries (from the package, still true)

- Loading times are a simplified teaching model: Office Wi-Fi = size × 25 ms; Simulated 3G = size × 250 ms. Nothing throttles the real network, compresses real files or uploads a course.
- The PDF row is a simulated handout, not a real download.
- No score, quiz, narration, analytics or persistence. State lives in memory only, and Reset or reload clears it.
- The walkthrough is a recording of the real UI, not a generated video. Its narration is captioned and transcribed (REPLICATION_PROMPT §11).
