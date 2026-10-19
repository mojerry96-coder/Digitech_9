/* ==========================================================
   OPENER: timeline from the house opener package (OPENER.md §4).
   About 4.5 s, skippable (Skip / Esc jump to the finished frame),
   and reduced motion shows the finished frame at once. Begin hands
   over to the narrated walkthrough, then the opening state.
   ========================================================== */
(function () {
  "use strict";

  const intro = document.getElementById("intro");
  const row = intro.querySelector(".intro-logos");
  const logos = [...intro.querySelectorAll(".intro-logo")];
  const beginBtn = intro.querySelector(".intro-begin");
  const skipBtn = intro.querySelector(".intro-skip");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(location.search);
  const timers = [];
  let finished = false;
  let shownCount = 1;

  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  /** Slide the row so the arrived logos sit centred. Layout positions only (no entry scale).
      Everything is measured from the row's own left edge. Current Chrome treats the transformed
      row as the logos' offsetParent while other engines use .intro-inner, so mixing the two
      coordinate spaces pushed the finished line off-centre. */
  const leftInRow = (el) => el.offsetLeft - (el.offsetParent === row ? 0 : row.offsetLeft);
  function centreOn(count) {
    const shown = logos.slice(0, Math.max(count, 1));
    const first = shown[0];
    const last = shown[shown.length - 1];
    const mid = (leftInRow(first) + leftInRow(last) + last.offsetWidth) / 2;
    row.style.setProperty("--shift", `${row.offsetWidth / 2 - mid}px`);
  }

  function showBegin() {
    timers.forEach(clearTimeout);
    logos.forEach((el) => el.classList.add("in", "set"));
    shownCount = logos.length;
    centreOn(logos.length);
    intro.classList.add("st-line", "st-title", "st-begin");
    beginBtn.focus({ preventScroll: true });
  }

  function finish(focusStart = true) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    intro.classList.add("out");
    // Begin plays the narrated walkthrough first (house pattern); ?nowalk goes straight to the opening state.
    window.SlowPreview.start(focusStart, { walkthrough: focusStart && !params.has("nowalk") });
    setTimeout(() => { intro.classList.add("gone"); intro.setAttribute("aria-hidden", "true"); }, reduced ? 0 : 700);
  }

  beginBtn.addEventListener("click", () => finish(true));
  skipBtn.addEventListener("click", showBegin);
  document.addEventListener("keydown", (e) => {
    if (finished || e.key !== "Escape") return;
    e.preventDefault();
    showBegin();
  });
  window.addEventListener("resize", () => centreOn(shownCount));

  // Dev / test links and design fixtures (?reference=) bypass the opener entirely
  if (params.has("skipintro") || params.has("reference")) {
    finish(false);
    intro.classList.add("gone");
    return;
  }

  if (reduced) { showBegin(); return; }

  function play() {
    if (finished) return;
    centreOn(1);
    const ENTER = 350, GAP = 1000, HOLD = 700;
    logos.forEach((el, i) => {
      at(ENTER + i * GAP, () => {
        shownCount = i + 1;
        centreOn(shownCount);
        el.classList.add("in");
      });
      at(ENTER + i * GAP + HOLD, () => el.classList.add("set"));
    });
    const settled = ENTER + (logos.length - 1) * GAP + HOLD;
    at(settled + 500, () => intro.classList.add("st-line"));
    at(settled + 750, () => intro.classList.add("st-title"));
    at(settled + 1400, () => { intro.classList.add("st-begin"); beginBtn.focus({ preventScroll: true }); });
  }

  // The logos must be laid out before the centre offsets mean anything.
  const imgs = [...intro.querySelectorAll(".intro-logo img")];
  Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))))
    .then(() => requestAnimationFrame(play));
})();
