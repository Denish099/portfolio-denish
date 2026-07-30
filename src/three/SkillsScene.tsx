import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SKILLS } from '../lib/data';
import { SkillIcon } from './SkillIcons';
import { makeEnvTexture } from './textures';

const RADIUS = 5.2;
const TAU = Math.PI * 2;

export interface RingCtl {
  rot: number;
  vel: number;
  target: number | null;
  dragging: boolean;
  paused: boolean;
  /** timestamp (ms) until which ambient rotation stays paused after a pick */
  holdUntil: number;
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

/** Points the camera at the ring's centre and adds a little pointer parallax. */
function CameraAim() {
  const { camera } = useThree();
  useFrame((state) => {
    camera.position.x += (state.pointer.x * 0.7 - camera.position.x) * 0.03;
    camera.lookAt(0, 0.35, 0);
  });
  return null;
}

function SkillNode({
  index,
  angle,
  baseY,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  index: number;
  angle: number;
  baseY: number;
  hovered: boolean;
  selected: boolean;
  onHover: (i: number | null) => void;
  onSelect: (i: number) => void;
}) {
  const skill = SKILLS[index];
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const active = hovered || selected;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    const inr = inner.current;
    if (!g || !inr) return;

    // gentle bob, offset per node
    const bob = Math.sin(t * 0.85 + index * 1.7) * 0.1;
    const push = active ? 0.55 : 0;
    const r = RADIUS + push;

    g.position.set(Math.sin(angle) * r, baseY + bob + (active ? 0.18 : 0), Math.cos(angle) * r);
    g.rotation.y = angle;

    // idle tumble; settles upright when active so the shape reads clearly
    const k = Math.min(1, dt * 6);
    const targetRotY = active ? 0 : Math.sin(t * 0.32 + index) * 0.5;
    const targetRotX = active ? 0 : Math.sin(t * 0.24 + index * 2.1) * 0.22;
    inr.rotation.y += (targetRotY - inr.rotation.y) * k;
    inr.rotation.x += (targetRotX - inr.rotation.x) * k;

    const targetScale = active ? 1.34 : 1;
    const s = inr.scale.x + (targetScale - inr.scale.x) * k;
    inr.scale.setScalar(s);
  });

  return (
    <group ref={group}>
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

      {/* selection bracket under the active node */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
        <ringGeometry args={[0.62, 0.66, 40]} />
        <meshBasicMaterial
          color={skill.accent}
          transparent
          opacity={active ? 0.75 : 0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* No distanceFactor on the label: it keeps a constant screen size, which
          reads as a HUD and stays sane on small canvases. */}
      {active && (
        <Html center position={[0, 1.55, 0]} zIndexRange={[40, 0]}>
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

  /**
   * Nodes sit on an undulating ring rather than a flat one: it fills the frame
   * vertically and stops neighbours from stacking up in a single band.
   */
  const layout = useMemo(
    () =>
      SKILLS.map((_, i) => {
        const angle = (i / SKILLS.length) * TAU;
        return { angle, baseY: Math.sin(angle * 2) * 1.2 };
      }),
    [],
  );

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
    // lifted a little so the nearest icon isn't clipped by the canvas floor
    <group ref={group} position={[0, 0.4, 0]}>
      {layout.map(({ angle, baseY }, i) => (
        <SkillNode
          key={SKILLS[i].id}
          index={i}
          angle={angle}
          baseY={baseY}
          hovered={hovered === i}
          selected={selected === i}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

/** Faint horizon grid so the ring feels anchored in space. Fog does the
 *  fading, so there's no backing plane to leave a hard edge. */
function Floor() {
  return <gridHelper args={[46, 46, '#1b3766', '#101f3d']} position={[0, -2.4, 0]} />;
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
  return (
    <Canvas
      dpr={[1, 1.7]}
      camera={{ position: [0, 1.05, 14], fov: 37 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={active ? 'always' : 'never'}
    >
      {/* fog starts beyond the front of the ring, so near icons stay crisp
          while the far side of the carousel recedes into the dark */}
      <fog attach="fog" args={['#05060d', 13.5, 27]} />
      <ProceduralEnv />
      <CameraAim />

      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 6]} intensity={1.5} color="#eaf4ff" />
      <pointLight position={[-6, 2, 4]} intensity={38} distance={16} color="#00f0ff" />
      <pointLight position={[6, -2, 3]} intensity={30} distance={16} color="#ff2d7e" />
      <pointLight position={[0, 5, -6]} intensity={22} distance={18} color="#8b5cff" />

      <Ring
        ctl={ctl}
        hovered={hovered}
        selected={selected}
        onHover={onHover}
        onSelect={onSelect}
      />
      <Floor />
    </Canvas>
  );
}

export { RADIUS, TAU };
