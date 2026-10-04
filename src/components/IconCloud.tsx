import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

/**
 * A rotating sphere of logos, after Magic UI's Icon Cloud
 * (magicui.design/docs/components/icon-cloud): icons sit on a Fibonacci sphere
 * drawn with the 2D canvas API, the cloud steers away from the pointer so the
 * icons under it roll forward, it can be dragged, and a clicked icon spins to
 * the front.
 *
 * Differences from the original, all for speed or sharpness: per-frame state
 * lives in refs (the original sets React state on every mouse move, which
 * re-renders and restarts its animation loop), logos are filled as vector
 * paths so they stay crisp at any DPR, icons are depth-sorted, motion is
 * time-based rather than per-frame, and the loop stops while `running` is false.
 */

export interface CloudIcon {
  id: string;
  label: string;
  /** SVG path data on a 24×24 viewBox — the simple-icons format */
  path: string;
  color: string;
  /** relative size: 1 for headline skills, smaller for supporting tools */
  weight?: number;
}

export interface IconCloudHandle {
  /** Spin the cloud so `id` faces the viewer. */
  focus: (id: string) => void;
}

interface Props {
  icons: CloudIcon[];
  /** highlighted icon: drawn larger and brighter, with a ring and a label */
  activeId?: string | null;
  /** false stops the frame loop entirely, e.g. while scrolled off-screen */
  running?: boolean;
  /** holds ambient rotation still, e.g. while the pointer is on a linked list */
  paused?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}

const TAU = Math.PI * 2;
/** camera distance from the centre, in sphere radii — lower is more fisheye */
const CAMERA = 3.2;
/** glow sprite edge in px; it is blurred, so resolution barely matters */
const GLOW = 64;
/** how long a picked icon stays put before ambient rotation resumes */
const HOLD_MS = 2600;
/** px of pointer travel that turns a click into a drag */
const DRAG_SLOP = 6;

interface Node {
  icon: CloudIcon;
  /** position on the unit sphere */
  x: number;
  y: number;
  z: number;
  path: Path2D;
  glow: HTMLCanvasElement;
  /** eased 0..1 highlight amount */
  emph: number;
}

interface Projected {
  i: number;
  sx: number;
  sy: number;
  size: number;
  /** depth on the rotated unit sphere: 1 nearest the viewer, -1 furthest */
  z: number;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const wrap = (a: number) => a - TAU * Math.round(a / TAU);

/**
 * Evenly spaced points on a unit sphere, visited with a stride coprime to `n`
 * so neighbouring inputs land far apart — otherwise the first items would all
 * cluster around one pole.
 */
function fibonacciSphere(n: number) {
  const inc = Math.PI * (3 - Math.sqrt(5));
  let stride = Math.max(1, Math.round(n * 0.382));
  while (gcd(stride, n) !== 1) stride++;

  return Array.from({ length: n }, (_, i) => {
    const k = (i * stride) % n;
    const y = 1 - ((k + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    return { x: Math.cos(k * inc) * r, y, z: Math.sin(k * inc) * r };
  });
}

/**
 * A soft halo in the icon's colour. The logo is drawn far off-canvas and only
 * its shadow lands inside, which blurs without `ctx.filter` (missing in Safari).
 */
function glowSprite(path: Path2D, color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = GLOW;
  const g = c.getContext('2d');
  if (!g) return c;
  const away = GLOW * 4;
  g.shadowColor = color;
  g.shadowBlur = GLOW * 0.14;
  g.shadowOffsetX = away;
  g.translate(GLOW / 4 - away, GLOW / 4);
  g.scale(GLOW / 2 / 24, GLOW / 2 / 24);
  g.fillStyle = color;
  g.fill(path);
  return c;
}

const IconCloud = forwardRef<IconCloudHandle, Props>(function IconCloud(
  { icons, activeId = null, running = true, paused = false, onHover, onSelect },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo<Node[]>(() => {
    if (typeof document === 'undefined') return [];
    const pts = fibonacciSphere(icons.length);
    return icons.map((icon, i) => {
      const path = new Path2D(icon.path);
      return { icon, ...pts[i], path, glow: glowSprite(path, icon.color), emph: 0 };
    });
  }, [icons]);

  // Everything the frame loop reads or writes. Kept out of React state so a
  // pointer move never triggers a render.
  const st = useRef({
    w: 0,
    h: 0,
    dpr: 1,
    rot: { x: -0.22, y: 0 },
    /** angular velocity, rad/s */
    spin: { x: 0, y: 0 },
    tween: null as null | { fx: number; fy: number; dx: number; dy: number; start: number; dur: number },
    holdUntil: 0,
    pointer: { x: 0, y: 0, inside: false },
    /** `dragging` flips once the press has moved past DRAG_SLOP */
    drag: { active: false, dragging: false, ox: 0, oy: 0, x: 0, y: 0, t: 0 },
    hover: -1,
    tag: -1,
    /** label box, measured whenever its text changes */
    tagW: 0,
    tagH: 0,
    projected: [] as Projected[],
  });

  // latest props, readable from the loop and the handlers without re-binding
  const props = useRef({ nodes, activeId, paused, onHover, onSelect });
  props.current = { nodes, activeId, paused, onHover, onSelect };

  const focusIndex = (i: number) => {
    const n = props.current.nodes[i];
    if (!n) return;
    const s = st.current;
    // yaw brings the icon onto the x = 0 plane, then pitch lifts it to +z
    const dy = wrap(Math.atan2(-n.x, n.z) - s.rot.y);
    const dx = wrap(Math.atan2(n.y, Math.hypot(n.x, n.z)) - s.rot.x);
    const dur = prefersReducedMotion()
      ? 0
      : Math.min(1400, Math.max(450, Math.hypot(dx, dy) * 700));
    s.spin.x = s.spin.y = 0;
    s.tween = { fx: s.rot.x, fy: s.rot.y, dx, dy, start: performance.now(), dur };
  };

  useImperativeHandle(ref, () => ({
    focus: (id: string) => focusIndex(props.current.nodes.findIndex((n) => n.icon.id === id)),
  }));

  /** Repaints the current state without advancing it; set while running. */
  const redraw = useRef<(() => void) | null>(null);

  // Match the backing store to the element's size and DPR. Resizing clears the
  // canvas, and observers fire after the frame's draw — so repaint here, or a
  // container that is still animating its height would show blank frames.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const s = st.current;
      s.w = entry.contentRect.width;
      s.h = entry.contentRect.height;
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(s.w * s.dpr);
      canvas.height = Math.round(s.h * s.dpr);
      redraw.current?.();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();

    /** Advances motion by `dt` seconds, then paints. */
    const render = (now: number, dt: number) => {
      const s = st.current;
      const { nodes, activeId, paused } = props.current;
      const { w, h, dpr } = s;
      if (!w || !h) return;

      const wide = w > 720;
      // keep clear of the readout card: lower-left when wide, the full bottom
      // edge when narrow
      const cx = w * (wide ? 0.63 : 0.5);
      const cy = h * (wide ? 0.47 : 0.37);
      const R = Math.min(wide ? w * 0.28 : w * 0.34, h * (wide ? 0.31 : 0.29));
      const base = Math.min(52, Math.max(24, R * 0.24));

      /* ---------- motion ---------- */

      if (s.tween) {
        const tw = s.tween;
        const p = tw.dur ? Math.min(1, (now - tw.start) / tw.dur) : 1;
        const e = 1 - Math.pow(1 - p, 3);
        s.rot.x = tw.fx + tw.dx * e;
        s.rot.y = tw.fy + tw.dy * e;
        if (p >= 1) {
          s.tween = null;
          s.holdUntil = now + HOLD_MS;
        }
      } else if (!s.drag.active) {
        let tx = 0;
        let ty = 0;
        const held = reduced || paused || s.hover >= 0 || now < s.holdUntil;
        if (!held && s.pointer.inside) {
          // steer: the side under the pointer rolls toward the viewer
          tx = ((s.pointer.y - cy) / (h / 2)) * 0.7;
          ty = (-(s.pointer.x - cx) / (w / 2)) * 1.1;
        } else if (!held) {
          tx = Math.sin(now * 0.00035) * 0.06;
          ty = 0.24;
        }
        // eases toward the target, which also bleeds off drag momentum
        const k = 1 - Math.exp(-dt * 2.4);
        s.spin.x += (tx - s.spin.x) * k;
        s.spin.y += (ty - s.spin.y) * k;
        s.rot.x += s.spin.x * dt;
        s.rot.y += s.spin.y * dt;
      }

      /* ---------- projection ---------- */

      const cX = Math.cos(s.rot.x);
      const sX = Math.sin(s.rot.x);
      const cY = Math.cos(s.rot.y);
      const sY = Math.sin(s.rot.y);
      const ek = 1 - Math.exp(-dt * 10);

      const out = s.projected;
      out.length = nodes.length;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const x1 = n.x * cY + n.z * sY;
        const z1 = -n.x * sY + n.z * cY;
        const y2 = n.y * cX - z1 * sX;
        const z2 = n.y * sX + z1 * cX;
        const persp = CAMERA / (CAMERA - z2);

        const on = n.icon.id === activeId || i === s.hover;
        n.emph += ((on ? 1 : 0) - n.emph) * ek;

        out[i] = {
          i,
          sx: cx + x1 * R * persp,
          sy: cy + y2 * R * persp,
          size: base * (n.icon.weight ?? 1) * persp * (1 + 0.38 * n.emph),
          z: z2,
        };
      }
      out.sort((a, b) => a.z - b.z);

      /* ---------- draw ---------- */

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // an equator that turns with the cloud — gives the sphere a body
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#00f0ff';
      for (const front of [false, true]) {
        ctx.beginPath();
        for (let k = 0; k <= 72; k++) {
          const a = (k / 72) * TAU;
          const x = Math.cos(a) * 1.08;
          const z = Math.sin(a) * 1.08;
          const x1 = x * cY + z * sY;
          const z1 = -x * sY + z * cY;
          const y2 = -z1 * sX;
          const z2 = z1 * cX;
          const persp = CAMERA / (CAMERA - z2);
          const px = cx + x1 * R * persp;
          const py = cy + y2 * R * persp;
          if ((z2 >= 0) === front) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.globalAlpha = front ? 0.16 : 0.06;
        ctx.stroke();
      }

      for (const p of out) {
        const n = nodes[p.i];
        const depth = (p.z + 1) / 2;
        let alpha = 0.14 + 0.86 * Math.pow(depth, 1.6);
        alpha += (1 - alpha) * n.emph;

        const g = p.size * 2;
        ctx.globalAlpha = alpha * (0.32 + 0.6 * n.emph);
        ctx.drawImage(n.glow, p.sx - g / 2, p.sy - g / 2, g, g);

        if (n.emph > 0.01) {
          ctx.globalAlpha = n.emph * 0.75;
          ctx.strokeStyle = n.icon.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, p.size * 0.86, 0, TAU);
          ctx.stroke();
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = n.icon.color;
        ctx.save();
        ctx.translate(p.sx - p.size / 2, p.sy - p.size / 2);
        ctx.scale(p.size / 24, p.size / 24);
        ctx.fill(n.path);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      /* ---------- floating label ---------- */

      const tag = tagRef.current;
      if (tag) {
        const ti = s.hover >= 0 ? s.hover : nodes.findIndex((n) => n.icon.id === activeId);
        const p = ti >= 0 ? out.find((q) => q.i === ti) : undefined;
        const vis = p ? Math.min(1, Math.max(0, (p.z + 0.2) / 0.5)) : 0;
        if (ti !== s.tag) {
          s.tag = ti;
          tag.textContent = ti >= 0 ? nodes[ti].icon.label : '';
          s.tagW = tag.offsetWidth;
          s.tagH = tag.offsetHeight;
        }
        tag.style.opacity = String(vis);
        if (p && vis > 0) {
          // sits above the icon, or below it when that would clip the top edge
          const gap = p.size * 0.95;
          const top = p.sy - gap - s.tagH >= 8 ? p.sy - gap - s.tagH : p.sy + gap;
          const left = Math.min(w - s.tagW - 8, Math.max(8, p.sx - s.tagW / 2));
          tag.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        }
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      render(now, Math.min(0.05, Math.max(0, (now - last) / 1000)));
      last = now;
    };

    redraw.current = () => render(performance.now(), 0);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      redraw.current = null;
    };
  }, [running]);

  /* ---------- pointer ---------- */

  const local = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** front-most icon under a point, or -1 */
  const hit = (x: number, y: number) => {
    const out = st.current.projected;
    for (let k = out.length - 1; k >= 0; k--) {
      const p = out[k];
      const r = p.size * 0.62;
      if ((x - p.sx) ** 2 + (y - p.sy) ** 2 < r * r) return p.i;
    }
    return -1;
  };

  const setHover = (i: number) => {
    const s = st.current;
    if (i === s.hover) return;
    s.hover = i;
    if (canvasRef.current) canvasRef.current.style.cursor = i >= 0 ? 'pointer' : '';
    props.current.onHover?.(i >= 0 ? props.current.nodes[i].icon.id : null);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current;
    const p = local(e);
    s.drag = { active: true, dragging: false, ox: p.x, oy: p.y, x: p.x, y: p.y, t: e.timeStamp };
    s.tween = null;
    s.spin.x = s.spin.y = 0;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current;
    const p = local(e);
    s.pointer = { x: p.x, y: p.y, inside: true };

    if (!s.drag.active) {
      setHover(hit(p.x, p.y));
      return;
    }

    if (!s.drag.dragging) {
      if (Math.hypot(p.x - s.drag.ox, p.y - s.drag.oy) < DRAG_SLOP) return;
      s.drag.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setHover(-1);
    }

    const dx = p.x - s.drag.x;
    const dy = p.y - s.drag.y;

    // one sphere radius of travel turns it about a radian
    const R = Math.max(80, Math.min(s.w, s.h) * 0.32);
    const ry = dx / R;
    const rx = -dy / R;
    s.rot.y += ry;
    s.rot.x += rx;

    // keep a smoothed velocity so a flick carries on after release
    const dt = Math.max(1 / 240, (e.timeStamp - s.drag.t) / 1000);
    s.spin.y = s.spin.y * 0.4 + Math.max(-7, Math.min(7, ry / dt)) * 0.6;
    s.spin.x = s.spin.x * 0.4 + Math.max(-7, Math.min(7, rx / dt)) * 0.6;
    s.drag.x = p.x;
    s.drag.y = p.y;
    s.drag.t = e.timeStamp;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current;
    if (!s.drag.active) return;
    s.drag.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (s.drag.dragging) return;

    const p = local(e);
    const i = hit(p.x, p.y);
    if (i < 0) return;
    focusIndex(i);
    props.current.onSelect?.(props.current.nodes[i].icon.id);
  };

  const onPointerLeave = () => {
    const s = st.current;
    s.pointer.inside = false;
    // a press that leaves before turning into a drag was never captured, so
    // its pointerup won't reach us
    if (!s.drag.dragging) s.drag.active = false;
    setHover(-1);
  };

  const onPointerCancel = () => {
    st.current.drag.active = false;
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="icloud"
        role="img"
        aria-label={`Tech stack: ${icons.map((i) => i.label).join(', ')}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerCancel}
      />
      <div className="icloud__tag" ref={tagRef} aria-hidden="true" />
    </>
  );
});

export default IconCloud;
