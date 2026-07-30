import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { IconKind } from '../lib/data';
import { makeGlyphTexture } from './textures';

/* ------------------------------------------------------------------
   Shared materials
   ------------------------------------------------------------------ */

interface MatProps {
  color: string;
  emissive?: string;
  intensity?: number;
  metalness?: number;
  roughness?: number;
}

function Holo({
  color,
  emissive,
  intensity = 0.42,
  metalness = 0.62,
  roughness = 0.22,
}: MatProps) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive ?? color}
      emissiveIntensity={intensity}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

/** Regular n-gon shape, optionally hollow — used for K8s and Node. */
function polygonShape(sides: number, radius: number, innerRadius = 0, rotate = 0) {
  const shape = new THREE.Shape();
  for (let i = 0; i < sides; i++) {
    const a = rotate + (i / sides) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  if (innerRadius > 0) {
    const hole = new THREE.Path();
    for (let i = 0; i < sides; i++) {
      const a = rotate + (i / sides) * Math.PI * 2;
      const x = Math.cos(a) * innerRadius;
      const y = Math.sin(a) * innerRadius;
      if (i === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

const EXTRUDE = { depth: 0.16, bevelEnabled: true, bevelSize: 0.028, bevelThickness: 0.03, bevelSegments: 3 };

/* ------------------------------------------------------------------
   AWS — cloud silhouette with the upward arrow beneath
   ------------------------------------------------------------------ */

function AwsIcon({ color, accent }: { color: string; accent: string }) {
  return (
    <group scale={0.95}>
      {/* cloud built from overlapping spheres */}
      <mesh position={[-0.42, 0.06, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <Holo color={color} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <Holo color={color} />
      </mesh>
      <mesh position={[0.44, 0.04, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <Holo color={color} />
      </mesh>
      <mesh position={[0, -0.1, 0]} scale={[1, 0.44, 0.8]}>
        <sphereGeometry args={[0.62, 32, 24]} />
        <Holo color={color} />
      </mesh>

      {/* the AWS "smile" arc */}
      <mesh position={[0, -0.62, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.52, 0.055, 12, 48, Math.PI * 0.78]} />
        <Holo color={accent} intensity={0.85} />
      </mesh>
      <mesh position={[0.44, -0.5, 0]} rotation={[0, 0, -0.9]}>
        <coneGeometry args={[0.11, 0.22, 4]} />
        <Holo color={accent} intensity={0.85} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   Kubernetes — the seven-sided helm
   ------------------------------------------------------------------ */

function KubernetesIcon({ color, accent }: { color: string; accent: string }) {
  const ring = useMemo(
    () => new THREE.ExtrudeGeometry(polygonShape(7, 0.86, 0.66, Math.PI / 2), EXTRUDE),
    [],
  );
  const hub = useMemo(
    () => new THREE.ExtrudeGeometry(polygonShape(7, 0.26, 0, Math.PI / 2), EXTRUDE),
    [],
  );

  const spokes = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = Math.PI / 2 + (i / 7) * Math.PI * 2;
        return { a, x: Math.cos(a) * 0.46, y: Math.sin(a) * 0.46 };
      }),
    [],
  );

  return (
    <group scale={0.92}>
      <mesh geometry={ring} position={[0, 0, -0.08]}>
        <Holo color={color} />
      </mesh>
      <mesh geometry={hub} position={[0, 0, -0.08]}>
        <Holo color={accent} intensity={0.7} />
      </mesh>
      {spokes.map(({ a, x, y }, i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[0, 0, a - Math.PI / 2]}>
          <boxGeometry args={[0.11, 0.42, 0.11]} />
          <Holo color={accent} intensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------
   Docker — whale carrying stacked containers
   ------------------------------------------------------------------ */

function DockerIcon({ color, accent }: { color: string; accent: string }) {
  const containers = useMemo(() => {
    const out: { pos: [number, number, number] }[] = [];
    const cols = 4;
    for (let c = 0; c < cols; c++) {
      const rows = c === 0 ? 2 : c === 1 ? 2 : 1;
      for (let r = 0; r < rows; r++) {
        out.push({ pos: [-0.36 + c * 0.245, 0.2 + r * 0.245, 0] });
      }
    }
    return out;
  }, []);

  return (
    <group scale={0.92} position={[0, -0.05, 0]}>
      {/* body */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, -0.14, 0]}>
        <capsuleGeometry args={[0.3, 0.92, 8, 20]} />
        <Holo color={color} metalness={0.5} roughness={0.28} />
      </mesh>
      {/* tail fin */}
      <mesh position={[-0.78, -0.02, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.2, 0.4, 3]} />
        <Holo color={color} metalness={0.5} roughness={0.28} />
      </mesh>
      {/* blowhole spout */}
      <mesh position={[0.5, 0.2, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <Holo color={accent} intensity={1} />
      </mesh>
      {/* containers */}
      {containers.map(({ pos }, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.21, 0.21, 0.21]} />
          <Holo color={accent} intensity={0.42} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------
   CI/CD — the DevOps infinity loop, with two travelling pulses
   ------------------------------------------------------------------ */

function CicdIcon({ color, accent }: { color: string; accent: string }) {
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 160;
    const s = 1.02;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const d = 1 + Math.sin(t) * Math.sin(t);
      pts.push(new THREE.Vector3((s * Math.cos(t)) / d, (s * Math.sin(t) * Math.cos(t)) / d, 0));
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  }, []);

  const tube = useMemo(() => new THREE.TubeGeometry(curve, 260, 0.062, 14, true), [curve]);

  const pulseA = useRef<THREE.Mesh>(null);
  const pulseB = useRef<THREE.Mesh>(null);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.24;
    if (pulseA.current) {
      curve.getPointAt(t % 1, v);
      pulseA.current.position.copy(v);
    }
    if (pulseB.current) {
      curve.getPointAt((t + 0.5) % 1, v);
      pulseB.current.position.copy(v);
    }
  });

  return (
    <group scale={0.92}>
      <mesh geometry={tube}>
        <Holo color={color} intensity={0.3} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh ref={pulseA}>
        <sphereGeometry args={[0.115, 20, 20]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh ref={pulseB}>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   React — nucleus with three elliptical orbits
   ------------------------------------------------------------------ */

function ReactIcon({ color, accent }: { color: string; accent: string }) {
  const orbits = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (orbits.current) orbits.current.rotation.z = state.clock.elapsedTime * 0.35;
  });

  return (
    <group scale={0.95}>
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <Holo color={accent} intensity={1.1} />
      </mesh>
      <group ref={orbits}>
        {[0, Math.PI / 3, -Math.PI / 3].map((rz, i) => (
          <mesh key={i} rotation={[0, 0, rz]} scale={[1, 0.4, 1]}>
            <torusGeometry args={[0.88, 0.042, 12, 96]} />
            <Holo color={color} intensity={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------
   Node.js — the hexagon
   ------------------------------------------------------------------ */

function NodeIcon({ color, accent }: { color: string; accent: string }) {
  const outer = useMemo(
    () => new THREE.ExtrudeGeometry(polygonShape(6, 0.92, 0, Math.PI / 2), { ...EXTRUDE, depth: 0.24 }),
    [],
  );
  const inner = useMemo(
    () => new THREE.ExtrudeGeometry(polygonShape(6, 0.6, 0, Math.PI / 2), { ...EXTRUDE, depth: 0.1 }),
    [],
  );

  return (
    <group scale={0.9}>
      <mesh geometry={outer} position={[0, 0, -0.12]}>
        <Holo color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh geometry={inner} position={[0, 0, 0.14]}>
        <Holo color={accent} intensity={0.7} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   Letter tiles — C++, JS, TS
   ------------------------------------------------------------------ */

function GlyphTile({
  glyph,
  color,
  accent,
}: {
  glyph: string;
  color: string;
  accent: string;
}) {
  const tex = useMemo(() => makeGlyphTexture(glyph), [glyph]);
  const tile = useMemo(() => {
    // rounded square via an extruded rounded shape
    const r = 0.22;
    const s = 0.84;
    const shape = new THREE.Shape();
    shape.moveTo(-s + r, -s);
    shape.lineTo(s - r, -s);
    shape.quadraticCurveTo(s, -s, s, -s + r);
    shape.lineTo(s, s - r);
    shape.quadraticCurveTo(s, s, s - r, s);
    shape.lineTo(-s + r, s);
    shape.quadraticCurveTo(-s, s, -s, s - r);
    shape.lineTo(-s, -s + r);
    shape.quadraticCurveTo(-s, -s, -s + r, -s);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.05,
      bevelSegments: 4,
    });
  }, []);

  return (
    <group scale={0.92}>
      <mesh geometry={tile} position={[0, 0, -0.14]}>
        <Holo color={color} intensity={0.3} metalness={0.45} roughness={0.28} />
      </mesh>
      {/* Glyph on both faces so the tile reads from either side.
          depthWrite is off on every plane here: their transparent areas would
          otherwise still write depth and knock rectangular holes in whatever
          sits behind the tile. */}
      <mesh position={[0, 0, 0.115]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -0.255]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {/* edge glow */}
      <mesh position={[0, 0, -0.07]} scale={1.045}>
        <planeGeometry args={[1.68, 1.68]} />
        <meshBasicMaterial color={accent} transparent opacity={0.06} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   Prisma — a literal triangular prism, glassy
   ------------------------------------------------------------------ */

function PrismaIcon({ color, accent }: { color: string; accent: string }) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.95);
    shape.lineTo(0.78, -0.62);
    shape.lineTo(-0.5, -0.62);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.36,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.04,
      bevelSegments: 3,
    });
  }, []);

  return (
    <group scale={0.9}>
      {/* Glassy look via translucency + clearcoat rather than `transmission`:
          the transmission pass renders a backdrop buffer that leaked a visible
          rectangle over the scene behind this icon. */}
      <mesh geometry={geom} position={[0, 0, -0.18]}>
        <meshPhysicalMaterial
          color={color}
          emissive={accent}
          emissiveIntensity={0.22}
          metalness={0.15}
          roughness={0.07}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.62}
          depthWrite={false}
        />
      </mesh>
      {/* inner core so the glass has something to refract */}
      <mesh position={[0, 0.05, 0]} scale={0.34}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   PostgreSQL — stacked database platters
   ------------------------------------------------------------------ */

function PostgresIcon({ color, accent }: { color: string; accent: string }) {
  const discs = [0.46, 0.0, -0.46];
  return (
    <group scale={0.95}>
      {discs.map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <cylinderGeometry args={[0.72, 0.72, 0.2, 48]} />
            <Holo color={color} metalness={0.62} roughness={0.24} />
          </mesh>
          {/* laid flat around the platter rim — a torus defaults to the XY
              plane, which would stand it up as a vertical hoop */}
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.022, 10, 56]} />
            <Holo color={accent} intensity={0.9} />
          </mesh>
        </group>
      ))}
      {/* spindle */}
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 1.3, 20]} />
        <Holo color={accent} intensity={0.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   MongoDB — the leaf
   ------------------------------------------------------------------ */

function MongoIcon({ color, accent }: { color: string; accent: string }) {
  const leaf = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.0);
    shape.bezierCurveTo(0.62, 0.3, 0.5, -0.55, 0, -0.95);
    shape.bezierCurveTo(-0.5, -0.55, -0.62, 0.3, 0, 1.0);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.06,
      bevelSegments: 4,
    });
  }, []);

  return (
    <group scale={0.92}>
      <mesh geometry={leaf} position={[0, 0, -0.15]}>
        <Holo color={color} metalness={0.42} roughness={0.3} />
      </mesh>
      {/* central rib */}
      <mesh position={[0, 0.02, 0.16]}>
        <boxGeometry args={[0.055, 1.75, 0.05]} />
        <Holo color={accent} intensity={0.95} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   Registry
   ------------------------------------------------------------------ */

export function SkillIcon({
  kind,
  color,
  accent,
}: {
  kind: IconKind;
  color: string;
  accent: string;
}) {
  switch (kind) {
    case 'aws':
      return <AwsIcon color={color} accent={accent} />;
    case 'kubernetes':
      return <KubernetesIcon color={color} accent={accent} />;
    case 'docker':
      return <DockerIcon color={color} accent={accent} />;
    case 'cicd':
      return <CicdIcon color={color} accent={accent} />;
    case 'react':
      return <ReactIcon color={color} accent={accent} />;
    case 'node':
      return <NodeIcon color={color} accent={accent} />;
    case 'cpp':
      return <GlyphTile glyph="C++" color={color} accent={accent} />;
    case 'javascript':
      return <GlyphTile glyph="JS" color={color} accent={accent} />;
    case 'typescript':
      return <GlyphTile glyph="TS" color={color} accent={accent} />;
    case 'prisma':
      return <PrismaIcon color={color} accent={accent} />;
    case 'postgres':
      return <PostgresIcon color={color} accent={accent} />;
    case 'mongodb':
      return <MongoIcon color={color} accent={accent} />;
  }
}
