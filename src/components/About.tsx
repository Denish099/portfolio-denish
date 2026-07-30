import { useEffect, useRef } from 'react';
import { CAPABILITIES, PROFILE, SKILLS } from '../lib/data';
import { gsap, prefersReducedMotion, useReveal } from '../lib/motion';
import './about.css';

/** Infinite marquee strip of the stack. */
function Marquee() {
  const items = [...SKILLS, ...SKILLS].map((s) => s.label);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {items.map((label, i) => (
          <span className="marquee__item" key={i}>
            {label}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function About() {
  const revealRef = useReveal<HTMLDivElement>();
  const statement = useRef<HTMLParagraphElement>(null);

  // word-by-word brighten as the statement scrolls through
  useEffect(() => {
    const el = statement.current;
    if (!el || prefersReducedMotion()) return;

    const words = el.querySelectorAll('span');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.5,
          scrollTrigger: {
            trigger: el,
            start: 'top 78%',
            end: 'bottom 45%',
            scrub: true,
          },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  const statementText =
    'I am a computer science student turning into a software developer — most at home where the backend meets the infrastructure it runs on. I design REST APIs and the schemas beneath them, containerise them, and ship them through pipelines that do the boring work for me.';

  return (
    <section className="about" id="about">
      <Marquee />

      <div className="wrap" ref={revealRef}>
        <div className="section-head">
          <span className="section-index" data-reveal>
            01 / about
          </span>
          <h2 className="section-title" data-reveal>
            Building <span className="outline-text">systems</span>
            <br />
            that hold up
          </h2>
        </div>

        <div className="about__grid">
          <p className="about__statement" ref={statement}>
            {statementText.split(' ').map((w, i) => (
              <span key={i}>{w} </span>
            ))}
          </p>

          <aside className="about__facts" data-reveal>
            <div className="about__fact">
              <span className="mono">Education</span>
              <p>{PROFILE.education.degree}</p>
              <p className="about__fact-sub">{PROFILE.education.school}</p>
              <p className="about__fact-sub">{PROFILE.education.period}</p>
            </div>
            <div className="about__fact">
              <span className="mono">Focus</span>
              <p>Backend · Cloud · DevOps</p>
              <p className="about__fact-sub">with a strong front-end habit</p>
            </div>
            <div className="about__fact">
              <span className="mono">Currently</span>
              <p>Open to software developer roles</p>
              <p className="about__fact-sub">internships & new grad</p>
            </div>
          </aside>
        </div>

        <div className="about__caps">
          {CAPABILITIES.map((c) => (
            <article className="cap" key={c.n} data-reveal>
              <span className="cap__n mono">{c.n}</span>
              <h3 className="cap__title">{c.title}</h3>
              <p className="cap__body">{c.body}</p>
              <span className="cap__line" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
