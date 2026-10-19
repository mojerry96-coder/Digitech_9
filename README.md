# DigiTech 9: Slow Connection Preview

DT01 · DT 05 04, *Previewing Your Own Lesson Under a Simulated 3G Connection*. A private practice for facilitators and lesson authors: preview a sample lesson on Office Wi-Fi and Simulated 3G, find the heavy media, optimise it, re-test deliberately and compare. There is no score and no tracking, and nothing is saved.

Everything is in [`slow-connection-preview/`](slow-connection-preview/README.md):

- **The simulation:** the house partner-logo opener, the narrated walkthrough, then one persistent page with seven states (a light Lesson Preview Frame and a navy Control Deck)
- **Generated media:** lesson imagery (Nano Banana Pro) and two Kling 3.0 clips (see [`assets/ASSET_PROMPTS.md`](slow-connection-preview/assets/ASSET_PROMPTS.md))
- **The 45 s narrated walkthrough:** the ElevenLabs Nigerian narrator, with captions and a transcript, recorded from the real build
- **The verification suite:** 24 checks (see [`QA_REPORT.md`](slow-connection-preview/QA_REPORT.md))

```bash
node slow-connection-preview/tools/serve.mjs 8095
```

Then open http://127.0.0.1:8095, or open `slow-connection-preview/index.html` directly.

To build the deliverables (a runnable folder, a ZIP and a single self-contained HTML file in `slow-connection-preview/dist/`):

```bash
node slow-connection-preview/tools/build-dist.mjs
```
