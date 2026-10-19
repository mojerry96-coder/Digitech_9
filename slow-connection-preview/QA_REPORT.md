# Verification report (rebuild, 19 Oct 2026)

Run: `node tests/verify.cjs` against this build, in headless Google Chrome on macOS with Playwright 1.55.1. The suite drives the real interface with browser-controlled time.

## Result

**26 of 26 checks passed** (the package's 20 plus 6 new ones). No browser JavaScript errors.

1. Fresh start: original lesson, no fabricated run history
2. Office Wi-Fi baseline uses 25 ms/MB
3. Media loads independently; all three text blocks remain instant
4. Changing conditions cancels an unfinished run safely
5. Optimise changes size without auto-running or overwriting evidence
6. Automatic condition run does not clear the deliberate re-test requirement
7. Deliberate re-test produces the real 10.5 → 1.5 second matching-condition comparison
8. Summary and optional private reflection work
9. All four media can be optimised; current sizes drive all re-test delays (1500, 500, 200, 375 ms; 10.3 MB)
10. Device width is independent; a missing baseline is not fabricated
11. Reset cancels pending callbacks and clears all practice state
12. Reload returns to a clean in-memory session
13. All seven default states fit 1920 × 1080
14. All seven default states fit 1366 × 768
15. 375 px viewport: no horizontal overflow; optimisation works
16. 390 px viewport: no horizontal overflow; optimisation works
17. Reduced motion removes decorative animation
18. Keyboard skip link reaches the controls
19. Diagnostic reference dialog opens and closes accessibly
20. **New:** Begin plays the narrated walkthrough with sound (app inert until Begin); Skip closes it and lands on Start Preview
21. **New:** the end-card Start Preview is a real button that starts the practice
22. **New:** the Kling hero clip plays only after its simulated load, without opening inspection
23. **New:** the narrated walkthrough plays in a closable dialog (Escape closes it and stops playback, voice included), and the practice state stays untouched
24. **New:** 1440 px opener: each logo stage targets the screen centre and the finished line sits centred (max 0.2 px off)
25. **New:** 375 px opener: the same (max 0.5 px off), with no sideways scroll
26. No browser JavaScript errors

## Also checked in the browser

- The opening clip autoplays once after Begin, and its Pause / Play control stays in sync.
- During a 3G run, the video stays behind the loading cover until 10.5 s.
- Playback survives re-renders: opening the log and switching to the summary did not restart it.
- A new run stops the clip and removes the Play clip control until the hero has loaded again.

## Walkthrough audio

- 44.6 s, H.264 + AAC 160 kbps, levelled to −16 LUFS (peak −4.4 dBFS).
- Silence analysis shows each narration line separated by 0.37–0.6 s gaps, with no overlaps.
- Contact-sheet frames confirm that each action happens during its own line.

## Opener alignment fix (19 Oct 2026)

The finished logo line sat 146 px right of centre (16 px at phone width). `centreOn()` mixed two coordinate spaces: current Chrome treats the transformed row as the logos' `offsetParent`, while the row's own position was measured against `.intro-inner`. It now measures everything from the row's left edge, which works whichever parent an engine reports. Checks 24 and 25 cover it.

## Limits

- Chromium on macOS only. This is not a cross-browser or screen-reader certification.
- Each clip ships as H.264 MP4 with a VP9 WebM fallback. Playback was checked with the MP4 in Chrome.
