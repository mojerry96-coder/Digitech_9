// Put the simulation together for delivery.
//   node tools/build-dist.mjs
// Writes, under dist/:
//   Slow_Connection_Preview/          the runnable app (runtime files only) + docs/
//   Slow_Connection_Preview.zip       the same folder, zipped (the single file ships beside it, not inside)
//   slow-connection-preview.html      one self-contained file: every script, style, font, image and
//                                     video embedded (MP4 only), so it opens offline from anywhere
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, statSync, readdirSync } from "node:fs";
import { join, dirname, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const app = join(dist, "Slow_Connection_Preview");
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(app, "docs"), { recursive: true });

/* ---------- 1. Runnable folder ---------- */
const RUNTIME = ["index.html", "src", "assets/fonts", "assets/logos", "assets/brand", "assets/media",
  "assets/opening-river.jpg", "assets/river-lesson.jpg", "assets/rain-photo.jpg", "assets/water-cycle.svg", "walkthrough"];
for (const p of RUNTIME) cpSync(join(root, p), join(app, p), { recursive: true });
rmSync(join(app, "walkthrough/cues.json"), { force: true });
for (const [from, to] of [["README.md", "README.md"], ["QA_REPORT.md", "QA_REPORT.md"], ["assets/ASSET_PROMPTS.md", "ASSET_PROMPTS.md"],
  ["walkthrough/transcript.md", "WALKTHROUGH_TRANSCRIPT.md"], ["REPLICATION_PROMPT.md", "REPLICATION_PROMPT.md"]])
  cpSync(join(root, from), join(app, "docs", to));
writeFileSync(join(app, "START_HERE.txt"), `SLOW CONNECTION PREVIEW
DT01 · DT 05 04 · Previewing Your Own Lesson Under a Simulated 3G Connection
MIVA Open University

Open index.html in Chrome, Edge, Firefox or Safari. Nothing to install, no account, no internet needed.
If your browser blocks local files, serve this folder instead:
    python3 -m http.server 8000      then visit http://localhost:8000

Single-file alternative: slow-connection-preview.html, delivered next to this ZIP
(everything embedded, about 16 MB; handy for LMS upload or email-free sharing).

What's inside
  index.html, src/        the simulation (one page, seven states; state is in memory only)
  assets/                 lesson imagery, Kling 3.0 clips, fonts (OFL), partner and MIVA logos
  walkthrough/            the 45 s narrated walkthrough (plays after Begin; Skip / Esc to go
                          straight to the practice), captions and poster
  docs/                   README, QA report, asset provenance, walkthrough transcript, replication prompt

No score, no tracking, no backend. Reset Lesson or reloading clears everything.
`);

/* ---------- 2. Single self-contained HTML ---------- */
const MIME = { ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".ttf": "font/ttf" };
const dataUri = rel => `data:${MIME[extname(rel)]};base64,${readFileSync(join(root, rel)).toString("base64")}`;
const ASSET_RE = /(?:\.\.\/)?((?:assets|walkthrough)\/[A-Za-z0-9._\/-]+\.(?:jpg|png|svg|mp4|ttf))/g;
const embed = text => text
  .replace(/<source src="[^"]+\.webm" type="video\/webm">/g, "")   // MP4 only, to keep the file small
  .replace(ASSET_RE, (_, rel) => dataUri(rel));

let html = readFileSync(join(root, "index.html"), "utf8");
html = html.replace(/<link rel="stylesheet" href="(src\/[^"?]+)(?:\?[^"]*)?">/g, (_, f) => `<style>\n${embed(readFileSync(join(root, f), "utf8"))}\n</style>`);
html = html.replace(/<script src="(src\/[^"?]+)(?:\?[^"]*)?"><\/script>/g, (_, f) => `<script>\n${embed(readFileSync(join(root, f), "utf8")).replace(/<\/script/gi, "<\\/script")}\n</script>`);
html = embed(html);
const leftovers = html.match(/(?:src|href|poster)="(?!data:|#|https?:)[^"]+"/g) || [];
if (leftovers.length) throw new Error("Unembedded references: " + leftovers.join(", "));
const single = join(dist, "slow-connection-preview.html");
writeFileSync(single, html);

/* ---------- 3. Zip ---------- */
execFileSync("zip", ["-qr", "-X", "Slow_Connection_Preview.zip", "Slow_Connection_Preview", "-x", "*.DS_Store"], { cwd: dist });

const size = p => (statSync(p).size / 1048576).toFixed(1) + " MB";
const count = d => readdirSync(d, { recursive: true }).filter(f => statSync(join(d, f)).isFile()).length;
console.log(`Folder: ${relative(root, app)} (${count(app)} files)`);
console.log(`Zip:    dist/Slow_Connection_Preview.zip (${size(join(dist, "Slow_Connection_Preview.zip"))})`);
console.log(`Single: dist/slow-connection-preview.html (${size(single)})`);
