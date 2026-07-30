import { useState } from 'react';
import { PROFILE } from '../lib/data';
import { useMagnetic, useReveal } from '../lib/motion';
import './contact.css';

const LINKS = [
  { label: 'GitHub', handle: PROFILE.githubHandle, href: PROFILE.github },
  { label: 'LinkedIn', handle: PROFILE.linkedinHandle, href: PROFILE.linkedin },
  { label: 'LeetCode', handle: PROFILE.leetcodeHandle, href: PROFILE.leetcode },
  { label: 'Codeforces', handle: PROFILE.codeforcesHandle, href: PROFILE.codeforces },
  { label: 'Résumé', handle: 'denish-goyal-resume.pdf', href: PROFILE.resume },
  { label: 'Email', handle: PROFILE.email, href: `mailto:${PROFILE.email}` },
];

export default function Contact() {
  const revealRef = useReveal<HTMLDivElement>();
  const magnetRef = useMagnetic<HTMLAnchorElement>(0.22);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="wrap" ref={revealRef}>
        <div className="section-head">
          <span className="section-index" data-reveal>
            05 / contact
          </span>
          <h2 className="section-title contact__title" data-reveal>
            Let’s build
            <br />
            <span className="outline-text">something</span>
          </h2>
        </div>

        <div className="contact__cta" data-reveal>
          <a
            className="contact__email glitch"
            href={`mailto:${PROFILE.email}`}
            ref={magnetRef}
            data-cursor="Email"
          >
            <span className="glitch__layer glitch__layer--a" aria-hidden="true">
              {PROFILE.email}
            </span>
            <span className="glitch__layer glitch__layer--b" aria-hidden="true">
              {PROFILE.email}
            </span>
            {PROFILE.email}
          </a>

          <button className="contact__copy mono" onClick={copy} data-cursor="Copy">
            {copied ? '✓ copied' : 'copy address'}
          </button>
        </div>

        <div className="contact__links">
          {LINKS.map((l) => (
            <a
              className="contact__link"
              key={l.label}
              href={l.href}
              target={l.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noreferrer"
              data-cursor="Open"
              data-reveal
            >
              <span className="contact__link-label mono">{l.label}</span>
              <span className="contact__link-handle">{l.handle}</span>
              <span className="contact__link-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>

        <footer className="foot">
          <div className="foot__row">
            <span className="mono">© 2026 {PROFILE.name}</span>
            <span className="mono">Built with React · Three.js · GSAP</span>
            <a className="mono link" href="#top">
              Back to top ↑
            </a>
          </div>
          <div className="foot__big display" aria-hidden="true">
            DENISH GOYAL
          </div>
        </footer>
      </div>
    </section>
  );
}
