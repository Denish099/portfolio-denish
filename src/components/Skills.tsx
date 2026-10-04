import { useCallback, useRef, useState } from 'react';
import IconCloud, { type CloudIcon, type IconCloudHandle } from './IconCloud';
import { SKILLS, TOOLS } from '../lib/data';
import { useReveal } from '../lib/motion';
import { useInView } from '../lib/useInView';
import './skills.css';

/** Headline skills at full size; supporting tools a step smaller. */
const CLOUD: CloudIcon[] = [
  ...SKILLS.map((s) => ({ id: s.id, label: s.label, path: s.icon.path, color: s.color })),
  ...TOOLS.map((t) => ({
    id: t.id,
    label: t.label,
    path: t.icon.path,
    color: t.color,
    weight: 0.78,
  })),
];

const skillIndex = (id: string | null) => (id ? SKILLS.findIndex((s) => s.id === id) : -1);

export default function Skills() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [listHover, setListHover] = useState(false);
  const revealRef = useReveal<HTMLDivElement>();
  const canvas = useInView<HTMLDivElement>();
  const cloud = useRef<IconCloudHandle>(null);

  /** Bring a skill to the front, from either the list or the cloud. */
  const select = useCallback((i: number) => {
    setSelected(i);
    cloud.current?.focus(SKILLS[i].id);
  }, []);

  // the cloud spins clicked icons to the front itself; just track the pick
  const onCloudSelect = useCallback((id: string) => {
    const i = skillIndex(id);
    if (i >= 0) setSelected(i);
  }, []);

  const hoveredSkill = skillIndex(hovered);
  const activeIndex = hoveredSkill >= 0 ? hoveredSkill : selected;
  const active = SKILLS[activeIndex];

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
            Twelve things I actually build with, plus the tools around them. Drag the cloud
            to spin it, or pick one from the list.
          </p>
        </div>
      </div>

      <div className="skills__stage wrap">
        <div
          className="skills__list"
          onPointerEnter={() => setListHover(true)}
          onPointerLeave={() => {
            setListHover(false);
            setHovered(null);
          }}
        >
          {SKILLS.map((s, i) => (
            <button
              key={s.id}
              className={`skills__item ${activeIndex === i ? 'is-active' : ''}`}
              onPointerEnter={() => setHovered(s.id)}
              onClick={() => select(i)}
              style={{ '--sk': s.color } as React.CSSProperties}
            >
              <span className="skills__item-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="skills__item-name">{s.label}</span>
              <span className="skills__item-cat mono">{s.category}</span>
            </button>
          ))}
        </div>

        <div className="skills__canvas" ref={canvas.ref}>
          <IconCloud
            ref={cloud}
            icons={CLOUD}
            activeId={hovered ?? active.id}
            running={canvas.inView}
            paused={listHover}
            onHover={setHovered}
            onSelect={onCloudSelect}
          />

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
