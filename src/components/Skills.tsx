import { Suspense, useCallback, useRef, useState } from 'react';
import SkillsScene, { RingCtl, TAU } from '../three/SkillsScene';
import { SKILLS } from '../lib/data';
import { useReveal } from '../lib/motion';
import { useInView } from '../lib/useInView';
import './skills.css';

export default function Skills() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState(0);
  const revealRef = useReveal<HTMLDivElement>();
  const canvas = useInView<HTMLDivElement>();

  const ctl = useRef<RingCtl>({
    rot: 0,
    vel: 0,
    target: null,
    dragging: false,
    paused: false,
    holdUntil: 0,
  });

  const drag = useRef({ active: false, lastX: 0, moved: 0 });

  /** Spin the ring so `i` lands at the front, taking the shortest path. */
  const spinTo = useCallback((i: number) => {
    const c = ctl.current;
    const desired = -(i / SKILLS.length) * TAU;
    // pick the rotation nearest to where we already are
    const k = Math.round((c.rot - desired) / TAU);
    c.target = desired + k * TAU;
    c.vel = 0;
    // let the pick sit still for a beat instead of immediately drifting off
    c.holdUntil = performance.now() + 3200;
  }, []);

  const select = useCallback(
    (i: number) => {
      setSelected(i);
      spinTo(i);
    },
    [spinTo],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { active: true, lastX: e.clientX, moved: 0 };
    ctl.current.dragging = true;
    ctl.current.target = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.lastX;
    drag.current.lastX = e.clientX;
    drag.current.moved += Math.abs(dx);
    const delta = dx * 0.006;
    ctl.current.rot += delta;
    ctl.current.vel = delta;
  };

  const endDrag = () => {
    drag.current.active = false;
    ctl.current.dragging = false;
  };

  const active = SKILLS[hovered ?? selected];

  return (
    <section className="skills" id="skills">
      <div className="wrap" ref={revealRef}>
        <div className="section-head">
          <span className="section-index" data-reveal>
            02 / stack
          </span>
          <h2 className="section-title" data-reveal>
            The <span className="outline-text">toolkit</span>
          </h2>
          <p className="lede" data-reveal>
            Twelve things I actually build with — rendered in real time. Drag the ring to
            spin it, or pick one from the list.
          </p>
        </div>
      </div>

      <div className="skills__stage wrap">
        <div className="skills__list">
          {SKILLS.map((s, i) => (
            <button
              key={s.id}
              className={`skills__item ${(hovered ?? selected) === i ? 'is-active' : ''}`}
              onPointerEnter={() => {
                setHovered(i);
                ctl.current.paused = true;
              }}
              onPointerLeave={() => {
                setHovered(null);
                ctl.current.paused = false;
              }}
              onClick={() => select(i)}
              style={{ '--sk': s.color } as React.CSSProperties}
            >
              <span className="skills__item-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="skills__item-name">{s.label}</span>
              <span className="skills__item-cat mono">{s.category}</span>
            </button>
          ))}
        </div>

        <div
          className="skills__canvas"
          ref={canvas.ref}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={() => {
            endDrag();
            setHovered(null);
            ctl.current.paused = false;
          }}
          onPointerEnter={() => {
            ctl.current.paused = true;
          }}
        >
          <Suspense fallback={<div className="skills__loading mono">initialising webgl…</div>}>
            <SkillsScene
              ctl={ctl}
              hovered={hovered}
              selected={selected}
              onHover={setHovered}
              onSelect={select}
              active={canvas.inView}
            />
          </Suspense>

          <div className="skills__hint mono">drag to rotate · click to focus</div>

          <div className="skills__readout" key={active.id}>
            <div className="skills__readout-bar" style={{ background: active.color }} />
            <div className="skills__readout-body">
              <span className="mono">{active.category}</span>
              <h3>{active.label}</h3>
              <p>{active.blurb}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
