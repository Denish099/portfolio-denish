import { useEffect, useRef, useState } from 'react';
import { PROJECTS, type Project } from '../lib/data';
import { gsap, prefersReducedMotion, useReveal } from '../lib/motion';
import './projects.css';

function ProjectRow({ project, i }: { project: Project; i: number }) {
  const row = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(i === 0);

  useEffect(() => {
    const el = row.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // the row lifts and un-blurs as it enters
      gsap.fromTo(
        el,
        { y: 70, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        },
      );
      // slow drift on the big index number
      gsap.to(el.querySelector('.pr__ghost'), {
        yPercent: -22,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <article
      className={`pr ${open ? 'is-open' : ''}`}
      ref={row}
      style={{ '--pc': project.color } as React.CSSProperties}
    >
      <span className="pr__ghost display" aria-hidden="true">
        {project.index}
      </span>

      <button
        className="pr__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-cursor={open ? 'Close' : 'Open'}
      >
        <span className="pr__index mono">{project.index}</span>
        <h3 className="pr__title display">{project.title}</h3>
        <span className="pr__subtitle">{project.subtitle}</span>
        <span className="pr__year mono">{project.year}</span>
        <span className="pr__toggle" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      <div className="pr__body">
        <div className="pr__body-inner">
          <p className="pr__desc">{project.description}</p>

          <ul className="pr__points">
            {project.highlights.map((h) => (
              <li key={h}>
                <span className="pr__bullet" />
                {h}
              </li>
            ))}
          </ul>

          <div className="pr__stack">
            {project.stack.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <span className="pr__rule" />
    </article>
  );
}

export default function Projects() {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <section className="projects" id="work">
      <div className="wrap" ref={revealRef}>
        <div className="section-head">
          <span className="section-index" data-reveal>
            03 / work
          </span>
          <h2 className="section-title" data-reveal>
            Selected <span className="outline-text">builds</span>
          </h2>
          <p className="lede" data-reveal>
            Three things I built end to end — the interface, the API and the infrastructure
            under both.
          </p>
        </div>

        <div className="projects__list">
          {PROJECTS.map((p, i) => (
            <ProjectRow project={p} i={i} key={p.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
