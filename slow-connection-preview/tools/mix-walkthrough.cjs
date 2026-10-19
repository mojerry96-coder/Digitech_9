/* Encode the recorded walkthrough frames with the narration placed at each cue.
   Usage: node tools/mix-walkthrough.cjs <framesDir>     (needs ffmpeg)
   Writes walkthrough/walkthrough-1080p.{mp4,webm}, poster.jpg, captions.vtt, transcript.md, cues.json. */
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const frames = path.resolve(process.argv[2] || path.join(root, 'tools/frames'));
const outDir = path.join(root, 'walkthrough');
const narr = path.join(root, 'tools/narration');
const rec = JSON.parse(fs.readFileSync(path.join(frames, 'cues.json'), 'utf8'));
const script = JSON.parse(fs.readFileSync(path.join(narr, 'script.json'), 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

// 1. Narration track: each line delayed to its cue start, mixed, padded to the video length, levelled.
const voiced = rec.cues.filter(c => c.audio);
const inputs = voiced.flatMap(c => ['-i', path.join(narr, c.audio)]);
const delays = voiced.map((c, i) => `[${i}:a]aresample=48000,adelay=${Math.round(c.start * 1000)}|${Math.round(c.start * 1000)}[a${i}]`).join(';');
const mix = `${delays};${voiced.map((_, i) => `[a${i}]`).join('')}amix=inputs=${voiced.length}:normalize=0,apad=whole_dur=${rec.duration.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
const wav = path.join(frames, 'narration.wav');
ff([...inputs, '-filter_complex', mix, '-map', '[out]', '-ar', '48000', '-ac', '2', wav]);

// 2. Video with narration.
const pattern = path.join(frames, '%05d.jpg');
ff(['-framerate', '30', '-i', pattern, '-i', wav, '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high',
  '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', path.join(outDir, 'walkthrough-1080p.mp4')]);
ff(['-framerate', '30', '-i', pattern, '-i', wav, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
  '-c:a', 'libopus', '-b:a', '96k', '-shortest', path.join(outDir, 'walkthrough-1080p.webm')]);
ff(['-i', path.join(frames, '00010.jpg'), '-vf', 'scale=1280:-2', '-q:v', '3', path.join(outDir, 'poster.jpg')]);

// 3. Captions (the spoken words) and transcript.
const ts = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = (s % 60).toFixed(3).padStart(6, '0'); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${x}`; };
fs.writeFileSync(path.join(outDir, 'captions.vtt'), ['WEBVTT', '', ...rec.cues.flatMap(c => [`${ts(c.start)} --> ${ts(c.end)}`, c.text, ''])].join('\n'));
const rows = rec.cues.map(c => `| ${c.start.toFixed(1)}–${c.end.toFixed(1)} s | ${c.text} |`).join('\n');
fs.writeFileSync(path.join(outDir, 'transcript.md'), `# Walkthrough transcript

About ${Math.round(rec.duration)} seconds, recorded from the real build with \`tools/record-walkthrough.cjs\` and mixed with \`tools/mix-walkthrough.cjs\`.

**Narrator:** ElevenLabs "${script.voice}" (\`${script.voice_id}\`), \`${script.model}\`, stability ${script.stability}, similarity ${script.similarity_boost}. That is the same voice and settings as the other MIVA walkthroughs. One file per line is in \`tools/narration/\`.

Captions are burned into the video and match the spoken words; numbers are shown as numerals. The 10.5 s Simulated 3G run is shown at 2× speed and labelled on screen. The re-test plays at real speed.

| Time | Narration |
|---|---|
${rows}
`);
fs.copyFileSync(path.join(frames, 'cues.json'), path.join(outDir, 'cues.json'));
console.log('Wrote', fs.readdirSync(outDir).join(', '));
