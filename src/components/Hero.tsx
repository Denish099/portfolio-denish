import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { PROFILE } from '../lib/data';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { useInView } from '../lib/useInView';
import './hero.css';

// three.js, R3F and the post-processing stack are ~1 MB of JS. Loading them in
// their own chunk keeps them off the critical path: the page paints and the
// intro plays while the orb streams in behind it.
const loadScene = () => import('../three/HeroScene');
const HeroScene = lazy(loadScene);

const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/\\<>';

/** Letter-by-letter scramble that settles on hover. */
function ScrambleWord({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  const run = () => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const state = { t: 0 };
    gsap.killTweensOf(state);
    gsap.to(state, {
      t: 1,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        const settled = state.t * text.length;
        let out = '';
        for (let i = 0; i < text.length; i++) {
          out +=
            i < settled ? text[i] : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
        }
        el.textContent = out;
      },
      onComplete: () => {
        el.textContent = text;
      },
    });
  };

  return (
    <span className={className} ref={ref} onPointerEnter={run} data-hot>
      {text}
    </span>
  );
}

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useInView<HTMLDivElement>();
  const [mountScene, setMountScene] = useState(false);
  const [sceneLive, setSceneLive] = useState(false);

  // Download the chunk right away, but hold off creating the WebGL context:
  // compiling its shaders blocks the main thread (seconds, on weak GPUs), which
  // would stall the preloader and the headline intro.
  useEffect(() => {
    loadScene();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (prefersReducedMotion()) {
      setMountScene(true);
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.from('.hero__line > *', {
        yPercent: 118,
        duration: 1.25,
        stagger: 0.09,
      })
        .from('.hero__meta > *', { y: 22, opacity: 0, duration: 0.9, stagger: 0.08 }, '-=0.75')
        .from('.hero__canvas', { opacity: 0, scale: 1.12, duration: 1.8 }, 0)
        .from('.hero__corner', { opacity: 0, duration: 1, stagger: 0.08 }, '-=1.1')
        .from('.hero__scroll', { opacity: 0, y: 16, duration: 0.8 }, '-=0.6')
        // the headline has landed by now; bring the orb in behind it
        .call(() => setMountScene(true), undefined, 0.75);

      // parallax the headline as you leave the hero
      gsap.to('.hero__head', {
        yPercent: -18,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero__canvas" ref={canvas.ref}>
        <div className={`hero__gl ${sceneLive ? 'is-live' : ''}`}>
          {mountScene && (
            <Suspense fallback={null}>
              <HeroScene active={canvas.inView} onReady={() => setSceneLive(true)} />
            </Suspense>
          )}
        </div>
      </div>

      <span className="hero__corner hero__corner--tl mono">
        {PROFILE.location} · UTC+5:30
      </span>
      <span className="hero__corner hero__corner--tr mono">
        B.Tech CS · UPES · ’27
      </span>

      <div className="hero__head wrap">
        <div className="hero__eyebrow eyebrow">Portfolio — 2026</div>

        <h1 className="hero__title display">
          <span className="hero__line reveal-line">
            <ScrambleWord text="DENISH" className="hero__word" />
          </span>
          <span className="hero__line reveal-line">
            <span className="hero__word hero__word--stroke">
              <ScrambleWord text="GOYAL" />
            </span>
          </span>
        </h1>

        <div className="hero__meta">
          <p className="hero__role mono">
            <i />
            {PROFILE.role}
          </p>
          <p className="hero__tag">{PROFILE.tagline}</p>
          <div className="hero__actions">
            <a className="btn btn--solid" href="#work" data-cursor="Browse">
              Selected work
            </a>
            <a className="btn" href="#contact" data-cursor="Say hi">
              Get in touch
            </a>
            <a
              className="btn btn--ghost"
              href={PROFILE.resume}
              target="_blank"
              rel="noreferrer"
              data-cursor="Open PDF"
            >
              Résumé ↗
            </a>
          </div>
        </div>
      </div>

      <a className="hero__scroll" href="#about" aria-label="Scroll to about">
        <span className="mono">scroll</span>
        <span className="hero__scroll-rail">
          <i />
        </span>
      </a>
    </section>
  );
}
