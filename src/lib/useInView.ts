import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether an element is near the viewport. Used to park the WebGL
 * canvases when their section is off-screen — two always-on scenes otherwise
 * render every frame for the whole page.
 */
export function useInView<T extends HTMLElement>(rootMargin = '260px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
