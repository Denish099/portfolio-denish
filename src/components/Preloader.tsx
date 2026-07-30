import { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import './preloader.css';

const BOOT_LINES = [
  'init  ▸ booting portfolio.sys',
  'auth  ▸ identity ····· DENISH GOYAL',
  'load  ▸ shaders / geometry / grid',
  'net   ▸ cluster handshake ····· ok',
  'ready ▸ press to enter',
];

const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/\\<>[]{}=+*';

export default function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onDone();
      return;
    }

    const ctx = gsap.context(() => {
      const counter = { v: 0 };
      const tl = gsap.timeline();

      // Scramble the name into place.
      const target = 'DENISH GOYAL';
      const scrambleState = { t: 0 };
      tl.to(scrambleState, {
        t: 1,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          const settled = Math.floor(scrambleState.t * target.length);
          let out = '';
          for (let i = 0; i < target.length; i++) {
            if (target[i] === ' ') {
              out += ' ';
            } else if (i < settled) {
              out += target[i];
            } else {
              out += SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
            }
          }
          if (nameRef.current) nameRef.current.textContent = out;
        },
      });

      // Boot lines type in.
      BOOT_LINES.forEach((_, i) => {
        tl.call(() => setVisibleLines(i + 1), undefined, 0.22 + i * 0.34);
      });

      // Load bar + percentage.
      tl.to(
        counter,
        {
          v: 100,
          duration: 2.1,
          ease: 'power2.inOut',
          onUpdate: () => {
            const v = Math.round(counter.v);
            if (pctRef.current) pctRef.current.textContent = String(v).padStart(3, '0');
            if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;
          },
        },
        0.2,
      );

      // Glitch out, then curtain-wipe away.
      tl.to(root.current, {
        keyframes: [
          { x: -7, skewX: 3, filter: 'invert(1)', duration: 0.06 },
          { x: 6, skewX: -2, filter: 'none', duration: 0.06 },
          { x: 0, skewX: 0, duration: 0.06 },
        ],
        delay: 0.15,
      })
        .to('.pl__panel', {
          scaleY: 0,
          transformOrigin: 'top center',
          duration: 0.85,
          ease: 'power4.inOut',
          stagger: { each: 0.055, from: 'start' },
        })
        .call(onDone, undefined, '-=0.35')
        .set(root.current, { pointerEvents: 'none', autoAlpha: 0 });
    }, root);

    return () => ctx.revert();
  }, [onDone]);

  return (
    <div className="pl" ref={root} aria-hidden="true">
      <div className="pl__panels">
        {Array.from({ length: 7 }).map((_, i) => (
          <div className="pl__panel" key={i} />
        ))}
      </div>

      <div className="pl__inner">
        <div className="pl__top">
          <span className="mono">portfolio.sys</span>
          <span className="mono">v1.0.0</span>
        </div>

        <div className="pl__center">
          <div className="pl__name display" ref={nameRef}>
            ············
          </div>
          <div className="pl__role mono">Software Developer</div>
        </div>

        <div className="pl__bottom">
          <div className="pl__log">
            {BOOT_LINES.slice(0, visibleLines).map((line) => (
              <div className="pl__log-line mono" key={line}>
                {line}
              </div>
            ))}
          </div>
          <div className="pl__meter">
            <div className="pl__bar">
              <span ref={barRef} />
            </div>
            <div className="pl__pct display">
              <span ref={pctRef}>000</span>
              <i>%</i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
