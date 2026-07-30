import { useEffect, useRef, useState } from 'react';
import { getLenis } from '../lib/motion';
import './nav.css';

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Stack' },
  { href: '#work', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const clock = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // live IST clock in the corner — small sign of life
  useEffect(() => {
    const tick = () => {
      if (!clock.current) return;
      clock.current.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    const target = document.querySelector(href);
    if (!target) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -20 });
    else target.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <a
          className="nav__logo"
          href="#top"
          onClick={(e) => go(e, '#top')}
          data-cursor="Top"
        >
          <span className="nav__logo-mark">DG</span>
          <span className="nav__logo-text mono">Denish Goyal</span>
        </a>

        <nav className="nav__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)}>
              <span>{l.label}</span>
              <span aria-hidden="true">{l.label}</span>
            </a>
          ))}
        </nav>

        <div className="nav__aside mono">
          <span className="nav__status">
            <i />
            open to roles
          </span>
          <span className="nav__clock" ref={clock} />
        </div>

        <button
          className={`nav__burger ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <i />
          <i />
        </button>
      </header>

      <div className={`nav__sheet ${open ? 'is-open' : ''}`}>
        {LINKS.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={(e) => go(e, l.href)}
            style={{ transitionDelay: `${open ? 0.08 + i * 0.05 : 0}s` }}
          >
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            {l.label}
          </a>
        ))}
      </div>
    </>
  );
}
