import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { ORB_FRAG, ORB_VERT } from './shaders';

/** Keeps the orb clear of the headline, which sits on the left. */
const OFFSET_X = 1.75;

/** Shader-displaced orb with a wireframe shell around it. */
function Orb() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const wire = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.26 },
      uFreq: { value: 1.05 },
      uColorA: { value: new THREE.Color('#070c22') },
      uColorB: { value: new THREE.Color('#3a1a9e') },
      uColorC: { value: new THREE.Color('#00d5ff') },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    if (mat.current) mat.current.uniforms.uTime.value = t;

    if (group.current) {
      group.current.rotation.y = t * 0.11;
      group.current.rotation.z = Math.sin(t * 0.14) * 0.16;

      // Sits off to the right so it never fights the headline for legibility.
      // Portrait viewports get a smaller offset, otherwise it slides off-frame.
      const px = state.pointer.x;
      const py = state.pointer.y;
      const offset = state.viewport.aspect < 1 ? OFFSET_X * 0.45 : OFFSET_X;
      group.current.rotation.x += (py * 0.28 - group.current.rotation.x) * 0.03;
      group.current.position.x += (offset + px * 0.3 - group.current.position.x) * 0.03;
    }
    if (wire.current) {
      wire.current.rotation.y = -t * 0.07;
      wire.current.rotation.x = t * 0.05;
      const s = 1.28 + Math.sin(t * 0.9) * 0.02;
      wire.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group} position={[OFFSET_X, -0.25, 0]} scale={0.94}>
      <mesh>
        <icosahedronGeometry args={[1.5, 48]} />
        <shaderMaterial
          ref={mat}
          vertexShader={ORB_VERT}
          fragmentShader={ORB_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={wire}>
        <icosahedronGeometry args={[1.5, 3]} />
        <meshBasicMaterial
          color="#ff2d7e"
          wireframe
          transparent
          opacity={0.13}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* thin equatorial ring, like an orbital marker */}
      <mesh rotation={[Math.PI / 2.1, 0, 0.4]}>
        <torusGeometry args={[2.35, 0.004, 3, 160]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, 0.5, -0.3]}>
        <torusGeometry args={[2.75, 0.003, 3, 160]} />
        <meshBasicMaterial color="#ffb43a" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

/** Slow drifting dust so the space reads as deep, not empty. */
function Dust({ count = 900 }: { count?: number }) {
  const pts = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = Math.random() * 0.03 + 0.008;
    }
    return { positions, sizes };
  }, [count]);

  useFrame((state) => {
    if (!pts.current) return;
    const t = state.clock.elapsedTime;
    pts.current.rotation.y = t * 0.018;
    pts.current.rotation.x = Math.sin(t * 0.05) * 0.08;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        sizeAttenuation
        color="#9fd8ff"
        transparent
        opacity={0.62}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Perspective grid receding into the dark — the cyberpunk floor. */
function GridFloor() {
  const grid = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (!grid.current) return;
    // scroll the grid toward camera on a loop
    const t = state.clock.elapsedTime;
    grid.current.position.z = ((t * 0.9) % 2) - 6;
  });

  return (
    <gridHelper
      ref={grid}
      args={[60, 30, '#1d3a6b', '#12244a']}
      position={[0, -3.1, -6]}
    />
  );
}

function Rig() {
  const { camera } = useThree();
  useFrame((state) => {
    const px = state.pointer.x;
    const py = state.pointer.y;
    camera.position.x += (px * 0.5 - camera.position.x) * 0.025;
    camera.position.y += (-py * 0.35 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene({ active = true }: { active?: boolean }) {
  const chroma = useMemo(() => new THREE.Vector2(0.0008, 0.001), []);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.6], fov: 45 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      frameloop={active ? 'always' : 'never'}
    >
      <fog attach="fog" args={['#04050a', 7, 20]} />
      <Orb />
      <Dust />
      <GridFloor />
      <Rig />

      {/* AA lives on the composer, not the canvas — see SkillsScene */}
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.5}
          kernelSize={KernelSize.LARGE}
          mipmapBlur
        />
        <ChromaticAberration
          offset={chroma}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </Canvas>
  );
}
