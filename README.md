# Denish Goyal — Portfolio

An interactive portfolio site. Design language borrows from 80s/90s anime and
cyberpunk UI: a glitch boot sequence, CRT grain and scanlines, and a real-time
WebGL scene of 3D skill icons you can spin.

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
| 3D | three.js via @react-three/fiber, @react-three/drei |
| Animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| Styling | Hand-written CSS with custom properties |

No CSS framework and no external 3D assets — every icon is generated from
three.js geometry at runtime, so there are no models or textures to download.

## Layout

```
src/
  main.tsx              entry; pins scroll to top on load
  App.tsx               section order, overlays, smooth-scroll wiring
  lib/
    data.ts             ALL CONTENT LIVES HERE — text, links, skills, projects
    motion.ts           GSAP + Lenis setup, reveal and magnetic-hover hooks
    useInView.ts        parks WebGL canvases when their section is off-screen
  components/           one .tsx + matching .css per section
  three/
    HeroScene.tsx       shader-displaced orb, dust field, grid floor
    SkillsScene.tsx     the rotating skill carousel
    SkillIcons.tsx      procedural geometry for each of the 12 icons
    shaders.ts          GLSL (simplex noise + the orb's vertex/fragment shaders)
    textures.ts         canvas-generated glyph tiles and environment map
```

## Editing content

Everything user-facing is in `src/lib/data.ts` — name, email, links, the skill
list, projects and experience. Change it there; no component edits needed.

To swap the résumé, replace `public/denish-goyal-resume.pdf` (keep the filename,
or update `PROFILE.resume`).

### Adding a skill

1. Add an entry to `SKILLS` in `src/lib/data.ts` with a new `id`.
2. Add that `id` to the `IconKind` union.
3. Add a matching `case` in the `SkillIcon` switch in `three/SkillIcons.tsx`,
   returning a component built from three.js geometry.

The carousel spaces itself automatically, so no layout maths to update.

## Interaction notes

- **Skills ring** — drag to spin, click an icon or a list row to bring it to the
  front. Ambient rotation pauses for ~3s after a pick, and while the pointer is
  over the canvas or the list.
- **Letter tiles** (JS / TS / C++) draw their glyph to a `<canvas>` and use it as
  a texture, which avoids shipping a 3D font.
- **Glass** uses translucency + clearcoat rather than `transmission`; the
  transmission pass leaked a visible rectangle over the scene behind it.
- **Post-processing** — both scenes run an `EffectComposer` (bloom, chromatic
  aberration, vignette). Antialiasing lives on the composer via
  `multisampling={4}`, not `gl.antialias` — with a composer the canvas's own AA
  never reaches the composed output.
- **Mirrored floor** — the skills scene's reflective floor is the single most
  expensive thing on the page. Set `MIRROR_FLOOR = false` at the top of
  `three/SkillsScene.tsx` to swap it for a flat floor if it feels heavy.
- **Performance** — each canvas has `frameloop` gated by an IntersectionObserver,
  so only the visible scene renders. DPR is capped at 1.6–1.75.
- **`prefers-reduced-motion`** skips the preloader, smooth scroll, scroll reveals
  and the grain/sweep overlays.

## Known constraints

- The `three` chunk is ~683 kB (~175 kB gzipped). That is three.js itself; it is
  split into its own chunk so it caches independently.
- WebGL is required for the hero orb and skills ring. There is no 2D fallback —
  on a context-loss or unsupported device those two areas render empty while the
  rest of the page works normally.
- Fonts load from Google Fonts, so first paint depends on that request.
