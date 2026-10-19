# Verification and reference exports

The app itself has no installation requirements. These optional developer scripts use Node.js and Playwright.

```bash
npm install --no-save playwright
npx playwright install chromium
node tests/verify.cjs
node tests/export-references.cjs
```

If using an already installed Chromium binary, set `PREVIEW_CHROMIUM_PATH` to its absolute executable path. The scripts open only this package's local files.

`verify.cjs` drives the actual interface with browser-controlled time. It checks the complete diagnostic cycle, independence of media delays, cancellation of interrupted runs, snapshot preservation, explicit re-test, all media optimisations, missing-baseline handling, reset, responsive sizes, reduced motion, keyboard entry and model-reference dialog.

`export-references.cjs` captures the seven static reference fixtures at 1920 × 1080 and three responsive supplements. Static fixtures exist for reproducible design review; the normal learner flow never uses them.
