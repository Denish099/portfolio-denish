import * as THREE from 'three';

/**
 * Draws a glyph ("JS", "TS", "C++") onto a canvas and returns it as a
 * transparent texture. Avoids shipping/fetching a 3D font while still
 * letting letter-based logos read correctly.
 */
export function makeGlyphTexture(text: string, color = '#04050a') {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // shrink long glyphs so "C++" doesn't run off the tile
  const weight = 700;
  const fontSize = text.length > 2 ? 190 : 240;
  ctx.font = `${weight} ${fontSize}px "Chakra Petch", "Space Grotesk", system-ui, sans-serif`;
  ctx.fillText(text, size / 2, size / 2 + 12);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * A small equirectangular gradient used as the scene environment so metal
 * and glass materials have something to reflect — no external HDR needed.
 */
export function makeEnvTexture() {
  const w = 512;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#070b22');
  g.addColorStop(0.34, '#16225a');
  g.addColorStop(0.5, '#0d3f66');
  g.addColorStop(0.66, '#2a1444');
  g.addColorStop(1, '#04050a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'lighter';
  const blob = (x: number, y: number, r: number, col: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  blob(110, 66, 95, 'rgba(255,45,126,0.85)');
  blob(392, 54, 86, 'rgba(0,240,255,0.9)');
  blob(258, 196, 74, 'rgba(255,180,58,0.42)');
  blob(20, 150, 70, 'rgba(139,92,255,0.6)');

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
