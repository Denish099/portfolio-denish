import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, MeshReflectorMaterial, Sparkles, Stars } from '@react-three/drei';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { SKILLS } from '../lib/data';
import { SkillIcon } from './SkillIcons';
import { makeEnvTexture } from './textures';

const RADIUS = 5.2;
const TAU = Math.PI * 2;
const RING_Y = 0.55;

/**
 * The mirrored floor is the most expensive thing in this scene — it re-renders
 * the whole scene into a blurred target every frame. Flip to `false` for a flat
 * floor if the section feels heavy on lower-end hardware; nothing else changes.
 */
const MIRROR_FLOOR = true;

export interface RingCtl {
  rot: number;
  vel: number;
  target: number | null;
  dragging: boolean;
  paused: boolean;
  /** timestamp (ms) until which ambient rotation stays paused after a pick */
  holdUntil: number;
}

interface Slot {
  angle: number;
  baseY: number;
}

/**
 * Nodes sit on an undulating ring rather than a flat one: it fills the frame
 * vertically and stops neighbours from stacking up in a single band.
 */
const LAYOUT: Slot[] = SKILLS.map((_, i) => {
  const angle = (i / SKILLS.length) * TAU;
  return { angle, baseY: Math.sin(angle * 2) * 1.2 };
});

/** World position of a node given the ring's current rotation. */
function slotPosition(slot: Slot, rot: number, out: THREE.Vector3) {
  const a = slot.angle + rot;
  return out.set(Math.sin(a) * RADIUS, slot.baseY + RING_Y, Math.cos(a) * RADIUS);
}

/** Procedural environment map so metal and glass have something to reflect. */
function ProceduralEnv() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const tex = makeEnvTexture();
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromEquirectangular(tex).texture;
    scene.environment = env;

    tex.dispose();
    pmrem.dispose();

    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  return null;
}

/** Points the camera at the ring, with pointer parallax and a slow dolly. */
function CameraAim() {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;

    // breathing dolly keeps the space feeling alive even when idle
    const targetZ = 14.2 + Math.sin(t * 0.16) * 0.75;
    const targetY = 1.05 - py * 0.55;

    camera.position.x += (px * 1.15 - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.position.z += (targetZ - camera.position.z) * 0.02;
    camera.lookAt(0, 0.45, 0);
    camera.rotation.z = px * 0.012;
  });

  return null;
}

function SkillNode({
  index,
  slot,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  index: number;
  slot: Slot;
  hovered: boolean;
  selected: boolean;
  onHover: (i: number | null) => void;
  onSelect: (i: number) => void;
}) {
  const skill = SKILLS[index];
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const active = hovered || selected;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    const inr = inner.current;
    if (!g || !inr) return;

    const bob = Math.sin(t * 0.85 + index * 1.7) * 0.1;
    const push = active ? 0.75 : 0;
    const r = RADIUS + push;

    g.position.set(
      Math.sin(slot.angle) * r,
      slot.baseY + bob + (active ? 0.2 : 0),
      Math.cos(slot.angle) * r,
    );
    g.rotation.y = slot.angle;

    // idle tumble; settles upright when active so the shape reads clearly
    const k = Math.min(1, dt * 6);
    const targetRotY = active ? 0 : Math.sin(t * 0.32 + index) * 0.5;
    const targetRotX = active ? 0 : Math.sin(t * 0.24 + index * 2.1) * 0.22;
    inr.rotation.y += (targetRotY - inr.rotation.y) * k;
    inr.rotation.x += (targetRotX - inr.rotation.x) * k;

    const targetScale = active ? 1.42 : 1;
    inr.scale.setScalar(inr.scale.x + (targetScale - inr.scale.x) * k);

    if (halo.current) {
      const m = halo.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = active ? 0.16 : 0;
      m.opacity += (targetOpacity - m.opacity) * k;
      halo.current.scale.setScalar(1 + Math.sin(t * 1.6 + index) * 0.06);
      halo.current.lookAt(state.camera.position);
    }
  });

  return (
    <group ref={group}>
      {/* soft backlight disc — bloom turns this into an aura */}
      <mesh ref={halo}>
        <circleGeometry args={[1.55, 40]} />
        <meshBasicMaterial
          color={skill.accent}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={inner}>
        <SkillIcon kind={skill.id} color={skill.color} accent={skill.accent} />

        {/* invisible, generous hit area — the icons themselves are spindly */}
        <mesh
          visible={false}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(index);
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(index);
          }}
        >
          <sphereGeometry args={[1.15, 12, 12]} />
        </mesh>
      </group>

      {/* selection bracket under the node */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
        <ringGeometry args={[0.62, 0.68, 40]} />
        <meshBasicMaterial
          color={skill.accent}
          transparent
          opacity={active ? 0.9 : 0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* No distanceFactor on the label: it keeps a constant screen size, which
          reads as a HUD and stays sane on small canvases. */}
      {active && (
        <Html center position={[0, 1.7, 0]} zIndexRange={[40, 0]}>
          <div className="sk3d-label">
            <span className="sk3d-label__name">{skill.label}</span>
            <span className="sk3d-label__cat">{skill.category}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Ring({
  ctl,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  ctl: React.MutableRefObject<RingCtl>;
  hovered: number | null;
  selected: number;
  onHover: (i: number | null) => void;
  onSelect: (i: number) => void;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const c = ctl.current;
    const step = Math.min(dt, 1 / 30);

    if (c.target !== null) {
      c.rot += (c.target - c.rot) * Math.min(1, step * 6);
      if (Math.abs(c.target - c.rot) < 0.001) {
        c.rot = c.target;
        c.target = null;
      }
    } else {
      c.rot += c.vel;
      c.vel *= 0.93;
      const held = performance.now() < c.holdUntil;
      if (!c.dragging && !c.paused && !held) c.rot += step * 0.14;
    }

    if (group.current) group.current.rotation.y = c.rot;
  });

  return (
    <group ref={group} position={[0, RING_Y, 0]}>
      {LAYOUT.map((slot, i) => (
        <SkillNode
          key={SKILLS[i].id}
          index={i}
          slot={slot}
          hovered={hovered === i}
          selected={selected === i}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

/**
 * A coloured light and a floor pool that both chase whichever icon is active,
 * so the whole room takes on that skill's colour.
 */
function ActiveSpot({
  ctl,
  activeIndex,
}: {
  ctl: React.MutableRefObject<RingCtl>;
  activeIndex: number;
}) {
  const light = useRef<THREE.PointLight>(null);
  const pool = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const k = Math.min(1, dt * 2.2);
    slotPosition(LAYOUT[activeIndex], ctl.current.rot, pos);
    tint.set(SKILLS[activeIndex].accent);

    if (light.current) {
      // pulled toward the camera so the active icon is lit from the front
      light.current.position.lerp(
        pos.clone().multiplyScalar(0.82).setY(pos.y + 0.9),
        k,
      );
      light.current.color.lerp(tint, k);
      light.current.intensity = 26 + Math.sin(state.clock.elapsedTime * 2.4) * 4;
    }

    if (pool.current) {
      pool.current.position.set(pos.x, -2.34, pos.z);
      const m = pool.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(tint, k);
    }
  });

  return (
    <>
      <pointLight ref={light} distance={17} decay={1.6} />
      <mesh ref={pool} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.1, 48]} />
        <meshBasicMaterial
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

/**
 * Wet-obsidian floor. The icons and their glow reflect in it, which is what
 * sells the "these objects sit in a room" illusion.
 *
 * Kept deliberately cheap: the mirror pass re-renders the scene every frame, so
 * the target is small and the blur kernel modest. Cranking `blur` into the
 * hundreds looks marginally softer and costs far more than it is worth.
 */
function Floor() {
  return (
    <group position={[0, -2.4, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        {MIRROR_FLOOR ? (
          <MeshReflectorMaterial
            resolution={256}
            mirror={0.55}
            mixBlur={1.6}
            mixStrength={3.2}
            blur={[140, 50]}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#080b18"
            metalness={0.66}
            roughness={0.85}
          />
        ) : (
          <meshStandardMaterial color="#080b18" metalness={0.6} roughness={0.4} />
        )}
      </mesh>
      {/* lifted a hair off the reflector plane to avoid z-fighting */}
      <gridHelper args={[70, 46, '#2a5fa8', '#12244a']} position={[0, 0.012, 0]} />
    </group>
  );
}

export default function SkillsScene({
  ctl,
  hovered,
  selected,
  onHover,
  onSelect,
  active = true,
}: {
  ctl: React.MutableRefObject<RingCtl>;
  hovered: number | null;
  selected: number;
  onHover: (i: number | null) => void;
  onSelect: (i: number) => void;
  active?: boolean;
}) {
  const chroma = useMemo(() => new THREE.Vector2(0.0007, 0.0009), []);
  const activeIndex = hovered ?? selected;

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.05, 14.2], fov: 37 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      frameloop={active ? 'always' : 'never'}
    >
      {/* fog starts beyond the front of the ring, so near icons stay crisp
          while the far side of the carousel recedes into the dark */}
      <fog attach="fog" args={['#05060d', 14, 30]} />
      <ProceduralEnv />
      <CameraAim />

      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 7, 6]} intensity={1.35} color="#eaf4ff" />
      <pointLight position={[-8, 2, 4]} intensity={44} distance={22} color="#00f0ff" />
      <pointLight position={[8, -2, 3]} intensity={36} distance={22} color="#ff2d7e" />
      <pointLight position={[0, 6, -7]} intensity={28} distance={24} color="#8b5cff" />

      <Ring
        ctl={ctl}
        hovered={hovered}
        selected={selected}
        onHover={onHover}
        onSelect={onSelect}
      />
      <ActiveSpot ctl={ctl} activeIndex={activeIndex} />
      <Floor />

      {/* atmosphere */}
      <Stars radius={70} depth={45} count={900} factor={3.4} saturation={0} fade speed={0.5} />
      <Sparkles
        count={110}
        scale={[20, 9, 20]}
        size={2.6}
        speed={0.32}
        opacity={0.55}
        color="#8fe4ff"
      />

      {/* multisampling here rather than gl.antialias: with a composer in play the
          canvas's own AA never reaches the composed output, so edges would be
          jagged. 4x MSAA on the composer's render targets is the cheap fix. */}
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.42}
          kernelSize={KernelSize.LARGE}
          mipmapBlur
        />
        <ChromaticAberration
          offset={chroma}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.24} darkness={0.72} />
        {/* light touch — the page already has a CSS grain layer over the top */}
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.16} />
      </EffectComposer>
    </Canvas>
  );
}

export { RADIUS, TAU };
