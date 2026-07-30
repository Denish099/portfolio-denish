import { useCallback, useEffect, useState } from 'react';
import Preloader from './components/Preloader';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Contact from './components/Contact';
import { getLenis, ScrollTrigger, useSmoothScroll } from './lib/motion';

export default function App() {
  const [ready, setReady] = useState(false);
  const onDone = useCallback(() => setReady(true), []);

  useSmoothScroll(ready);

  // The browser restores the previous scroll offset once layout settles, which
  // drops a reloading visitor into the middle of the page. Pin to the top until
  // the intro is done.
  useEffect(() => {
    const toTop = () => window.scrollTo(0, 0);
    toTop();
    const raf = requestAnimationFrame(toTop);
    const id = window.setTimeout(toTop, 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, []);

  // sections mount at different times; make sure triggers measure correctly
  useEffect(() => {
    if (!ready) return;
    getLenis()?.scrollTo(0, { immediate: true });
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 240);
    return () => window.clearTimeout(id);
  }, [ready]);

  return (
    <>
      <Cursor />
      <Preloader onDone={onDone} />

      <div className="backdrop" aria-hidden="true" />

      <div className="shell">
        <Nav />
        <main>
          <Hero ready={ready} />
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Contact />
        </main>
      </div>

      <div className="fx-layer fx-scanlines" aria-hidden="true" />
      <div className="fx-layer fx-grain" aria-hidden="true" />
      <div className="fx-layer fx-vignette" aria-hidden="true" />
      <div className="fx-layer fx-sweep" aria-hidden="true" />
    </>
  );
}
