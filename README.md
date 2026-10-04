# Denish Goyal — Portfolio

An interactive portfolio site. Design language borrows from 80s/90s anime and
cyberpunk UI: a glitch boot sequence, CRT grain and scanlines, a WebGL hero orb,
and a 3D cloud of tech-stack logos you can spin.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Opens on <http://127.0.0.1:5180>.

```bash
npm run build
```

Outputs a static site to `dist/` — deployable as-is to Vercel, Netlify, GitHub
Pages, Cloudflare Pages or any static host.

```bash
npm run preview
```

Serves the production build locally.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React 18 + TypeScript + Vite |
| 3D | three.js via @react-three/fiber (hero); 2D canvas icon cloud (stack) |
| Logos | simple-icons (SVG paths, bundled — no runtime fetches) |
| Animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| Styling | Hand-written CSS with custom properties |

No CSS framework and no external 3D assets. The hero is generated from three.js
geometry and shaders at runtime; the stack logos are SVG paths bundled from
simple-icons, so there are no models, textures or images to download.

## Layout

```
src/
  main.tsx              entry; pins scroll to top on load
  App.tsx               section order, overlays, smooth-scroll wiring
  lib/
    data.ts             ALL CONTENT LIVES HERE — text, links, skills, projects
    motion.ts           GSAP + Lenis setup, reveal and magnetic-hover hooks
    useInView.ts        parks animated canvases when their section is off-screen
  components/           one .tsx + matching .css per section
    IconCloud.tsx       the rotating 3D logo sphere in the stack section
  three/                lazy-loaded — never on the critical path
    HeroScene.tsx       shader-displaced orb, dust field, grid floor
    shaders.ts          GLSL (simplex noise + the orb's vertex/fragment shaders)
```

## Editing content

Everything user-facing is in `src/lib/data.ts` — name, email, links, the skill
list, projects and experience. Change it there; no component edits needed.

To swap the résumé, replace `public/denish-goyal-resume.pdf` (keep the filename,
or update `PROFILE.resume`).

### Adding a skill

1. Import its logo from `simple-icons` at the top of `src/lib/data.ts`
   (`siVercel`, `siRedis`, … — names are `si` + the slug on simpleicons.org).
2. Add an entry to `SKILLS` (gets a list row and readout) or `TOOLS` (cloud
   only, drawn a step smaller) with that `icon` and a `color` that reads on the
   dark background — brand colours like GitHub's near-black vanish.

The cloud spaces itself automatically, so no layout maths to update.

`simple-icons` is pinned to v11: later majors dropped the AWS logos.

## Interaction notes

- **Icon cloud** — modelled on Magic UI's
  [Icon Cloud](https://magicui.design/docs/components/icon-cloud): logos on a
  Fibonacci sphere, drawn with the 2D canvas API. The cloud rolls toward the
  pointer, can be dragged (with momentum), and a clicked icon or list row spins
  to the front and holds for ~2.5s. Ambient rotation stops while the pointer is
  on an icon or the list.
- **Hero post-processing** — the hero runs an `EffectComposer` (bloom, chromatic
  aberration). Antialiasing lives on the composer via `multisampling`, not
  `gl.antialias` — with a composer the canvas's own AA never reaches the
  composed output. It drops from 4x to 2x MSAA on high-DPR screens.
- **`prefers-reduced-motion`** skips the preloader, smooth scroll, scroll reveals,
  the grain/sweep overlays and the cloud's ambient spin.

## Performance

- **Critical path is ~130 kB gzipped** (React, GSAP, Lenis, app code). three.js,
  R3F and post-processing (~235 kB gzipped) sit in a lazy chunk that downloads
  while the preloader runs.
- **The hero's WebGL context is created after the headline lands.** Shader
  compilation blocks the main thread — for seconds on weak GPUs — so doing it
  during the preloader stretched the intro. The orb fades in when its first
  frames are ready.
- **The stack section is a 2D canvas, not WebGL.** It replaced a second WebGL
  scene with a mirrored floor and a four-pass composer, which was the most
  expensive thing on the page.
- **`manualChunks` gives React its own chunk.** Rollup pulls a manual chunk's
  unassigned dependencies into it, so without that React lands in `r3f` and the
  entry has to load every 3D chunk up front. Check `dist/index.html` has no
  `modulepreload` for `three` or `r3f` after changing chunking.
- **The preloader is ~2s** and fast-forwards on any click, key, wheel or touch.
- **Fonts don't block first paint** — the Google Fonts stylesheet is preloaded
  and applied on load; the preloader covers the swap.
- Each animated canvas stops its frame loop when off-screen, and the hero caps
  DPR at 1.5.

## Known constraints

- The `three` chunk is ~683 kB (~175 kB gzipped). That is three.js itself; it is
  lazy-loaded and split into its own chunk so it caches independently. Vite's
  "chunk larger than 500 kB" warning refers to it.
- WebGL is required for the hero orb. There is no fallback — on a context-loss
  or unsupported device that area renders empty while the rest of the page
  works normally. The icon cloud needs only the 2D canvas API.
- Fonts load from Google Fonts. Text renders in system fallbacks until they
  arrive.
