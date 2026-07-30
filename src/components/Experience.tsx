import { EXPERIENCE } from '../lib/data';
import { useReveal } from '../lib/motion';
import './experience.css';

export default function Experience() {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <section className="exp" id="experience">
      <div className="wrap" ref={revealRef}>
        <div className="section-head">
          <span className="section-index" data-reveal>
            04 / experience
          </span>
          <h2 className="section-title" data-reveal>
            Where I’ve <span className="outline-text">shipped</span>
          </h2>
        </div>

        <div className="exp__list">
          {EXPERIENCE.map((job) => (
            <article className="exp__item" key={job.company} data-reveal>
              <div className="exp__meta">
                <span className="exp__period mono">{job.period}</span>
                <span className="exp__mode mono">{job.mode}</span>
              </div>

              <div className="exp__main">
                <header className="exp__header">
                  <h3 className="exp__company display">{job.company}</h3>
                  <p className="exp__role mono">{job.role}</p>
                </header>

                <p className="exp__summary">{job.summary}</p>

                <ul className="exp__points">
                  {job.points.map((p, i) => (
                    <li key={p}>
                      <span className="exp__n mono">{String(i + 1).padStart(2, '0')}</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <div className="exp__stack">
                  {job.stack.map((s) => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
