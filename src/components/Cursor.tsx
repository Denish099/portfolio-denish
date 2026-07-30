import { useEffect, useRef } from 'react';
import { gsap } from '../lib/motion';

/**
 * Two-part cursor: a hard dot that tracks 1:1 and a lagging ring that
 * inflates over interactive elements. Elements can opt into a text label
 * with data-cursor="VIEW".
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;

    document.body.classList.add('custom-cursor');

    const dx = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'none' });
    const dy = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'none' });
    const rx = gsap.quickTo(r, 'x', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(r, 'y', { duration: 0.5, ease: 'power3.out' });
    const lx = gsap.quickTo(l, 'x', { duration: 0.42, ease: 'power3.out' });
    const ly = gsap.quickTo(l, 'y', { duration: 0.42, ease: 'power3.out' });

    gsap.set(l, { scale: 0, opacity: 0 });

    const HOT = 'a, button, [data-hot], input, textarea';
    let labelShown = false;

    /**
     * Hover state is derived from whatever is under the pointer on every move,
     * rather than from pointerover/pointerout. Those events go missing when the
     * page scrolls out from under a stationary cursor, which used to leave the
     * label stuck on screen.
     */
    const onMove = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      lx(e.clientX + 22);
      ly(e.clientY + 16);

      const hot = (e.target as HTMLElement | null)?.closest?.(HOT) as HTMLElement | null;
      r.classList.toggle('is-hot', !!hot);

      const text = hot?.getAttribute('data-cursor') ?? null;
      if (text && !labelShown) {
        l.textContent = text;
        labelShown = true;
        gsap.to(l, { scale: 1, opacity: 1, duration: 0.32, ease: 'power3.out' });
      } else if (text) {
        l.textContent = text;
      } else if (labelShown) {
        labelShown = false;
        gsap.to(l, { scale: 0, opacity: 0, duration: 0.22, ease: 'power2.in' });
      }
    };

    const hideLabel = () => {
      if (!labelShown) return;
      labelShown = false;
      gsap.to(l, { scale: 0, opacity: 0, duration: 0.22, ease: 'power2.in' });
    };

    const onDown = () => gsap.to(r, { scale: 0.72, duration: 0.2, ease: 'power2.out' });
    const onUp = () => gsap.to(r, { scale: 1, duration: 0.3, ease: 'power2.out' });
    const onLeaveWindow = () => {
      r.classList.add('is-hidden');
      hideLabel();
    };
    const onEnterWindow = () => r.classList.remove('is-hidden');

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('scroll', hideLabel, { passive: true });
    document.addEventListener('mouseleave', onLeaveWindow);
    document.addEventListener('mouseenter', onEnterWindow);

    return () => {
      document.body.classList.remove('custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', hideLabel);
      document.removeEventListener('mouseleave', onLeaveWindow);
      document.removeEventListener('mouseenter', onEnterWindow);
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ring} />
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-label" ref={label} />
    </>
  );
}
