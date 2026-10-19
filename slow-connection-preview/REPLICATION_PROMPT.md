# Replicate Slow Connection Preview as one changing workspace

## Task

Implement or adapt the enclosed runnable experience. Use the seven numbered desktop reference images as the visual authority. These are **seven states of one page**, not seven separate pages, routes, slides or screens with unrelated arrangements. Preserve the single shell, dimensions, regions, typography and interaction model throughout.

Read `source-documents/Simulation_Storyboard.pdf` and `source-documents/Minimal_Design_Master.md`. Preserve the storyboard's pedagogical rules, seeded values and timing formulas. Apply the supplied minimal-design principles to presentation. `index.html`, `src/model.js`, `src/states.js`, `src/app.js` and `src/styles.css` provide complete runnable replication code. Do not replace working behaviour with static mockups.

Do not add a backend, external media fetching, AI responses, learner tracking, an upload workflow, new scenes or quizzes. The learner diagnoses a controlled sample lesson. The lesson's title does not imply that this version accepts their own live course.

## 1. Experience structure

Maintain these permanent regions:

1. White topbar: small product identifier at left; restrained institutional wordmark and Reset Lesson at right.
2. Light Lesson Preview Frame on the left: ordinary lesson content and simulated media. The media itself remains the visual focus.
3. Dark navy Control Deck on the right: conditions, evidence, the current contextual action, and descriptive results.

The opening uses the same shell. The river photograph fills the left region and a small introduction occupies the deck. Start Preview reveals the lesson in the same region. Later states replace only deck contents and media load states. Keep the outer columns in place.

No fixed sidebar, permanent step navigation, numbered progress pills, dashboard card grid, giant icons or repeated title blocks. No nested glass surfaces. The reference gallery is a developer handoff aid, not part of the learner flow.

The storyboard's five beats map to the references as follows:

| Source beat | Reference states |
| --- | --- |
| Enter and baseline | 01 opening, 02 Wi-Fi baseline |
| Observe | 03 3G loading |
| Diagnose and optimise | 04 media inspection, 05 re-test required |
| Re-test and compare | 06 comparison |
| Review and transfer | 07 diagnostic summary |

## 2. Design tokens and geometry

The actual implementation is authoritative; do not substitute generic component-library defaults.

```css
:root {
  --ink: #132239;
  --navy: #0B192E;
  --navy-surface: #12243D;
  --paper: #F7FAFC;
  --blue: #176BFF;
  --blue-hover: #0758E5;
  --muted: #A6B7CE;
  --line: rgba(186, 204, 229, .18);
  --mint: #81D8B3;
  --amber: #F1C77F;
  --font-body: Manrope, system-ui, sans-serif;
  --font-display: Afacad, system-ui, sans-serif;
  --ease: cubic-bezier(.22, 1, .36, 1);
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(380px, 31.5vw, 530px);
  height: calc(100dvh - 64px);
}
```

- Primary references: 1920 × 1080. Also fit 1366 × 768 without clipped controls or unnecessary document scrolling.
- Topbar: 64px; 54px in the compact desktop breakpoint.
- Left padding: 28–60px horizontally, 28–36px vertically, tightened at 768px height.
- Right padding: 24–44px horizontally; 22–42px top depending on viewport.
- The deck has one contextual inset surface when needed. It is not a stack of many cards.
- Small interface icons: 16–20px. Large video play indicator: 58px circle. Avoid inflated 3D icons for diagnostic controls; these are precise, understated line icons.
- Buttons: solid royal blue, 6px corner radius, minimum 44px height. Do not add multicolour gradients, large glow, oversized pills or glass buttons.
- Interactive media: 7px corners, 2px hover outline and 3px blue selected outline.
- Body copy: Manrope. Headings and numeric emphasis: Afacad. Fonts are local assets.
- Keep labels short. Do not enlarge the global title on every state. The source's teaching explanations belong in optional reference content, not persistent paragraphs.
- Navy/white contrast and restrained blue actions implement the uploaded minimal guide while retaining the source's light lesson/dark diagnostics distinction.

## 3. The sample lesson

Illustrative subject: **Understanding the water cycle**. This subject and its imagery are presentation choices, not extra assessed learning content.

Keep the following exactly:

| Element | Original size | Optimised size | Office Wi-Fi before → after | Simulated 3G before → after |
| --- | ---: | ---: | --- | --- |
| Hero video | 42 MB | 6 MB | 1.05 → 0.15 s | 10.5 → 1.5 s |
| Diagram | 8 MB | 2 MB | 0.20 → 0.05 s | 2.0 → 0.5 s |
| Photo | 3 MB | 0.8 MB | 0.075 → 0.020 s | 0.75 → 0.20 s |
| PDF handout | 5 MB | 1.5 MB | 0.125 → 0.0375 s | 1.25 → 0.375 s |
| Text | 3 blocks | Unchanged | Instant | Instant |

UI times may be rounded for legibility. The model schedules delays to the nearest millisecond and displays seconds to two decimals with unnecessary trailing zeros removed. Original total = 58 MB. Video-only optimisation = 22 MB. All-media optimisation = 10.3 MB.

The lesson contains exactly these three instantly available text blocks:

1. **Water is always moving.** It travels between the land, the oceans and the atmosphere.
2. **Powered by the Sun.** Heat turns liquid water into vapour.
3. **Returning as rain.** Water collects and the cycle continues.

Use the supplied river image for the simulated hero video and the supplied rain photograph for the photo asset. Use `water-cycle.svg` for the diagram. Retain the same visuals after optimisation; this simulation changes weights, not visual quality. Do not pretend a still-image tile is a real playable video or the handout row is a real PDF download. Their interaction is **Inspect**.

## 4. Shared state and timing

```js
const delayMs = (sizeMB, connection) =>
  Math.round(sizeMB * (connection === '3g' ? 250 : 25));

const previewState = {
  started: false,
  connection: 'wifi',
  device: 'desktop',
  media: [/* original + current size, optimisation and load state */],
  selected: null,
  revision: 0,
  pending: false,
  run: null,
  history: [],
  baseline: {},
  comparison: null,
  traces: [],
  observed3g: false,
  verifiedRevision: null,
  panel: null,
  reflection: '',
  selectedBottlenecks: []
};
```

These are simplified, authored demonstration timings, not real bandwidth estimates. A quiet **Simulated model / How timings work** control opens the formulas and limitations.

Media elements load independently. Do not add their delays together to invent a total lesson load time. In the video-only example, the video takes 1.5 seconds after optimisation while the unchanged diagram takes 2 seconds. The 10.5 → 1.5 comparison is explicitly labelled **Hero video**, not total page speed.

Every run snapshots connection, device, media sizes, revision and element delays at its start. A later optimisation must not rewrite the earlier run. Cancel callbacks from interrupted runs using a run token. Record only completed runs in the completed history. Do not let an old callback update a newly reset or newly started run.

## 5. State-by-state replication

Each state has its own detailed file in `spec/`, including the actual relevant render functions. They all use `index.html` and `styles.css`.

### 01 — Opening

Use `references/01_opening.jpg` and `spec/01_opening.md`.

- Full image in the left region; bottom-left display copy: **Will your lesson / load on 3G?**
- Secondary line: **Preview. Optimise. Re-test.**
- Deck title: **Preview your lesson**.
- Starting conditions: Office Wi-Fi · Desktop; 4 media files · 3 text blocks.
- One primary action: **Start Preview**.
- Start creates the real baseline run. No playback, score or identity form precedes this task.

### 02 — Wi-Fi baseline

Use `references/02_wifi_baseline.jpg` and `spec/02_wifi_baseline.md`.

- Show the ordinary fully loaded lesson with all four original media sizes.
- Display actual run evidence in the right-hand log.
- Lesson weight **58 MB**; optimised **0 of 4**.
- Primary action: **Test on Simulated 3G**.
- The network and device segmented controls are independent and text-labelled.
- Files can be inspected, but the initial constrained run must be observed before optimisation is enabled. This ensures a usable before record for the diagnostic cycle.

### 03 — Observe 3G

Use `references/03_3g_loading.jpg` and `spec/03_3g_loading.md`.

- Switching connection starts a new run immediately.
- Each media tile begins with a neutral loading placeholder. A restrained spinner/shimmer indicates loading; no artificial countdown is shown.
- Text remains visible immediately. Each media tile returns when its own calculated delay completes.
- The exported reference freezes a moment after the smaller items have completed while the video is still loading.
- During a live run, **Test in progress** is disabled; media selection remains available.
- After completion, invite selection through the preview or log. Do not automatically identify or preselect the video for the learner.

### 04 — Inspect media

Use `references/04_media_inspection.jpg` and `spec/04_media_inspection.md`.

- The selected media receives a restrained blue outline. The left region stays in place.
- Deck title: **Inspect the media**.
- A single callout shows name, size, latest measured load and the authored export target.
- Video note: **This 42 MB video is heavy for a short explainer.**
- Clarity reminder: **Use a smaller export while keeping the explanation clear.**
- Primary action: **Optimise hero video** (label varies for the chosen media).
- Latest run is an expandable compact section, reducing competing content.
- Text blocks have no optimisation controls.
- No correct/incorrect notice, performance score or fabricated ideal-size claim.

### 05 — Optimised, awaiting re-test

Use `references/05_retest_required.jpg` and `spec/05_retest_required.md`.

- Show **Hero video optimised**, **42 MB → 6 MB**, **Appearance preserved**.
- Update the simulated size tag and total weight immediately: **22 MB**, **1 of 4**.
- Retain previous run timings and explicitly label them as previous evidence.
- Show amber **Re-test required** status.
- Primary action: **Re-test on Simulated 3G**.
- Optimise must **not** invoke `runTest` or clear the requirement.
- The learner may select and optimise more media before re-testing.

### 06 — Re-test comparison

Use `references/06_retest_comparison.jpg` and `spec/06_retest_comparison.md`.

- The deliberate action starts a new real simulated run using current sizes.
- On completion, show the selected matching-condition before/after evidence.
- Video-only example: **Hero video loads faster**; **Before 10.5 s → After 1.5 s**.
- Small proportional bars are evidence, not a score. Use actual timing ratios.
- The last run remains available on demand. Show current total weight and optimised count.
- Primary action: **Review Summary**.
- Never compare Desktop/Wi-Fi directly against Mobile/3G and attribute all differences to optimisation. Baselines are keyed by connection and device.
- If a matching original baseline is missing, state this plainly and show current timings; do not synthesize an observed result. Switching back to a previously measured condition restores the possibility of that comparison on an explicit re-test.

### 07 — Diagnostic summary

Use `references/07_diagnostic_summary.jpg` and `spec/07_diagnostic_summary.md`.

- Same lesson remains on the left. The deck now shows a descriptive summary.
- Video-only example: **58 MB → 22 MB**, **1 of 4**, **Desktop · Simulated 3G**.
- List the actual changes, completed run history and element timings.
- Optional private reflection: **What will you check in your own lesson?**
- Reflection starts empty. No grading or AI evaluation.
- Primary action: **Re-test on Simulated 3G**. Secondary action: **Reset lesson**.
- Reset clears all state immediately, returns the original sizes and Wi-Fi/Desktop, and reveals the opening. No confirmation dialog.

## 6. Completion and edge conditions

```js
const complete = state =>
  state.observed3g &&
  state.media.some(media => media.optimised) &&
  state.verifiedRevision === state.revision &&
  !state.pending;
```

This is a workflow condition, not a pass mark. `verifiedRevision` is set only after a deliberate 3G re-test completes. When a new optimisation occurs, the revision increases and pending becomes true.

Connection switches automatically re-run media as required by the source. **When changes are pending, such an automatic run must not count as the deliberate re-test.** It can show current loading evidence, but the re-test-required state remains. This resolves the source's simultaneous automatic connection testing and explicit optimisation re-test requirements.

Device changes reflow the lesson and begin a new condition run. They do not change the timing multiplier. This keeps each run's device label accurate. Interrupted runs are discarded rather than mixed into completed history.

Reset cancels all active timers, clears logs and snapshots, clears reflection and selection, restores original sizes, and returns to Office Wi-Fi/Desktop. Reloading has the same initial-state effect because persistence is session memory only. Do not add Continue Simulation for a new or reloaded session without separately authorised persistence requirements.

## 7. Motion and feedback

- Keep motion restrained: 180ms hover, 320ms content entrance, 450ms device-width reflow using the provided easing.
- Hover: a fine outline and a small Inspect label. Pointer press: 1px down. No exaggerated scaling.
- Loading: calm spinner and slow shimmer; never an artificial urgency timer.
- Optimise: in-place size and evidence change. Do not flash a giant success overlay or alter the lesson image.
- Retest: media transitions through loading again using the smaller sizes; payoff comes from actual shorter delays.
- No confetti, bounce, floating particles or pulsing large icons.
- Respect `prefers-reduced-motion`; disable decorative motion while keeping loading states readable and retaining the pedagogical delays.
- No narration or music is needed. There are no audio dependencies or sound/pause controls added to this diagnostic tool.

## 8. Device and responsive behaviour

- At desktop width, keep the light preview and dark deck side by side.
- Desktop lesson uses available width. Tablet preview caps at 680px; mobile preview caps at 390px. These widths affect only the lesson frame.
- A narrow lesson preview may scroll internally because it represents a small device. Keep the external controls usable and stationary.
- At actual viewport widths of 900px or below, stack the preview above the deck. This purposeful page scroll preserves readable content and touch targets.
- Verify 375px and 390px actual viewport widths: no horizontal overflow; network, device, optimisation, re-test and reset remain accessible.
- At 1366 × 768, fit the normal desktop states without clipped primary actions. Optional expanded logs may scroll inside the deck; collapse them by default.

## 9. Accessibility

Use semantic buttons, accessible names and visible keyboard focus. All interactions are achievable with keyboard, touch and pointer. Text-labelled toggles use `aria-pressed`. Media selection is available from either preview objects or the equivalent log list. Status is conveyed through text and shape as well as colour.

Use a polite live region for run updates. Keep focus stable during asynchronous updates; move focus to the selected inspector or re-test action only following the relevant intentional action. The model-reference dialog supports Escape. There must be no correct-answer hints in hidden accessibility labels.

Minimum interaction targets are 44px. Support reduced motion. Do not depend on colour, audio, drag or hold interactions. No time limit or reading-speed penalty.

## 10. Asset and implementation handoff

- Preserve the bundled images and SVG without substituting unrelated stock art.
- Avoid remote font/CDN dependencies; fonts are bundled.
- If porting to React, keep a single `SlowConnectionPreview` component tree with state-driven deck content, using the same domain model and timing lifecycle. Do not turn every reference into a route. Cancel timers in effect cleanups and retain immutable run snapshots.
- Keep `src/states.js`'s seven renderers or equivalent seven state components. Shared region code remains shared.
- If a real Miva logo is later provided, replace the small institutional wordmark only; do not invent a logo or redesign the page.
- The AI-generated concept is exploratory visual direction. Final numbered reference JPGs correspond to the supplied code and take priority where exact text or spacing differs.
- Do not insert reference-screen fixtures into normal gameplay. `?reference=` exists only to reproduce handoff images.

## 11. Optional walkthrough

The source does not require a produced intro video. The delivered opening uses the generated still image and concise copy. No motion-graphic video is included or claimed.

If a walkthrough is later commissioned, record the actual UI for 15–20 seconds: baseline → 3G placeholder → inspect media → optimise → explicit re-test → matching-condition comparison. Use no voice-over by default. Keep it supplementary, skippable, and separate from the real timed run. Do not let it pre-complete the learner's activity. Any added spoken audio needs captions and a transcript.

## 12. Final acceptance checklist

1. One persistent shell; no invented new learning scenes.
2. Four media objects and exactly three instant text blocks.
3. Correct original sizes, fixed reduction presets and timing multipliers.
4. Media completion occurs individually, with correct current-run evidence.
5. Optimise changes size only and leaves earlier measurements intact.
6. At least one explicit post-change 3G re-test is required for completion.
7. Automatic condition tests do not silently complete that requirement.
8. Comparisons use matching conditions; missing baselines are acknowledged.
9. Every file can be inspected and optimised; text cannot be optimised.
10. Video-only total is 22 MB; all-four total is 10.3 MB.
11. New runs and Reset cannot be mutated by old callbacks.
12. No score, arbitrary size target, quiz, backend or persistent learner data.
13. Keyboard, reduced motion and narrow viewport operation remain usable.
14. Reference images match the code, with no clipped elements or unexplained UI.
