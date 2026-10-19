# Asset provenance (rebuild, 19 Oct 2026)

All imagery and video in this build were generated for it on Higgsfield. Nothing is taken from a third-party lesson. The original package assets (`river-lesson.png`, `rain-photo.png`) were replaced; the water-cycle diagram stays code-native SVG.

| File | Model | Source job | Use |
|---|---|---|---|
| `river-lesson.jpg` | Nano Banana Pro, 4K, 16:9 (Higgsfield's job record labels it `nano_banana_2`) | `a3ccc8e3-ab26-4018-93f2-f9f6742779e2` | Hero video poster |
| `opening-river.jpg` | Nano Banana Pro, 4K, 16:9 | `1b9e1cc7-8465-4d7c-a0a1-db43e3084bad` | Opening state poster |
| `rain-photo.jpg` | Nano Banana Pro, 4K, 16:9 | `2aa7cee6-b8e9-424f-9be9-84512668ac2d` | Lesson photo |
| `media/river-lesson.mp4` | Kling 3.0, pro mode, 10 s, silent, start frame = `river-lesson` still | `4c502382-0e4a-4d0d-9cb6-dbe670139269` | Hero video (plays after its simulated load) |
| `media/opening-river.mp4` | Kling 3.0, pro mode, 10 s, silent, start frame = `opening-river` still | `cb31c448-1a05-47fb-b4e7-bcd168dbb1f2` | Opening background (plays once) |

Stills were downscaled from 5504 × 3072 PNG to JPEG (2400 / 2560 / 1800 px wide). Clips were re-encoded from 1928 × 1072 to H.264 without audio (1600 px and 1920 px wide, faststart): 2.8 MB and 2.4 MB, each with a VP9 WebM fallback.

## Prompts

**River lesson still.** Photorealistic landscape photograph for a science lesson about the water cycle. A Nigerian freshwater river winding through verdant tropical hills in the West African countryside, oil palms and broadleaf trees along the banks, sandy bends, distant layered green hills, bright blue sky with white cumulus clouds, warm early-morning sunlight with gentle haze in the valleys. Cinematic wide shot from a modest elevated viewpoint, the river leading through the centre of the frame into the distance. Natural, believable colour and water reflections, crisp detail, documentary realism. Leave calm, slightly darker foliage in the lower-left third for overlaid text. No people, no text, no logos, no watermark, no interface.

**Opening still.** Photorealistic aerial-style landscape photograph for a water-cycle lesson: a broad river meandering through lush tropical rainforest hills in southwestern Nigeria, morning mist rising from the water and the forest canopy (evaporation), soft clouds gathering over the far ridges, golden sunlight from the left, deep greens and blue water. Elevated vantage point, river curving from foreground into the distance, wide 16:9 composition with a quieter darker foreground in the lower-left. Natural colour, documentary realism, high detail. No people, no text, no logos, no watermark.

**Rain photo.** Photorealistic close-up photograph of fresh raindrops on a window pane, sharply detailed droplets and a few running streaks in the foreground, softly blurred lush Nigerian tropical greenery and misty hills beyond the glass, overcast daylight, muted greens and blue-grey highlights, shallow depth of field. Restrained documentary photography for a science lesson on precipitation, 16:9 landscape. No people, no text, no icons, no interface, no watermark.

**Hero clip (Kling 3.0).** Slow, smooth aerial drone glide forward along the winding river toward the distant green hills. Gentle shimmer and slow current on the water surface, palm fronds and treetops swaying lightly in a soft breeze, white clouds drifting slowly across the sky, warm early-morning sunlight. Stable, steady cinematic camera with no shake and no cuts. Natural documentary realism. No people, no animals, no text, no logos.

**Opening clip (Kling 3.0).** Very slow cinematic aerial push-in over the misty rainforest river valley at sunrise. Morning mist rises gently from the river and the forest canopy, low clouds drift slowly over the far ridges, soft golden light shifts subtly. Calm, stable camera, one continuous shot, no cuts. Natural documentary realism, serene mood. No people, no animals, no text, no logos.

## Code-native and supplied assets

- `water-cycle.svg` and the line icons: authored in code (package originals).
- `fonts/`: Afacad and Manrope, SIL Open Font License (licences alongside).
- `logos/`: partner logos and chevron motif from `Fix_the_Prompt_Opener.zip` (house opener).
- `brand/miva-logo-blue.png`: the supplied MIVA Open University logo, replacing the package's text wordmark as REPLICATION_PROMPT §10 allows.
