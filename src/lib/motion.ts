import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Shared Lenis instance so components can pause/resume scrolling. */
let lenisInstance: Lenis | null = null;
export const getLenis = () => lenisInstance;

export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });
    lenisInstance = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Lenis 1.x drives native window scroll, so ScrollTrigger needs no proxy —
    // it just needs to be told when Lenis has moved (the `scroll` handler above).
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  // Lock scrolling while the preloader is up.
  useEffect(() => {
    const lenis = lenisInstance;
    if (!lenis) {
      document.body.style.overflow = enabled ? '' : 'hidden';
      return;
    }
    if (enabled) lenis.start();
    else lenis.stop();
  }, [enabled]);
}

/**
 * Fades + lifts children of a container into view on scroll.
 * Any descendant marked [data-reveal] becomes a staggered step.
 */
export function useReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const targets = el.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { y: 46, opacity: 0, filter: 'blur(6px)' },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.05,
          ease: 'power3.out',
          stagger: 0.085,
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/** Magnetic hover: element leans toward the cursor. */
export function useMagnetic<T extends HTMLElement>(strength = 0.28) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);

  return ref;
}

/** Splits text into per-character spans for stagger animations. */
export function splitChars(text: string) {
  return text.split('');
}
