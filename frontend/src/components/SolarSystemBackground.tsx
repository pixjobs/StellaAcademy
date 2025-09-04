'use client';

import { useState, useEffect, useRef, useMemo, Suspense, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Line, Preload, useTexture, Loader } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------
// Asset base path & Texture registry
// -----------------------------
const texturePaths = {
  sun: '/textures/2k_sun.jpg',
  mercury: '/textures/2k_mercury.jpg',
  venus: '/textures/2k_venus_surface.jpg',
  venusClouds: '/textures/2k_venus_atmosphere.jpg',
  earth: '/textures/2k_earth_daymap.jpg',
  earthClouds: '/textures/2k_earth_clouds.jpg',
  moon: '/textures/2k_moon.jpg',
  mars: '/textures/2k_mars.jpg',
  jupiter: '/textures/2k_jupiter.jpg',
  saturn: '/textures/2k_saturn.jpg',
  saturnRings: '/textures/2k_saturn_ring_alpha.png',
  uranus: '/textures/2k_uranus.jpg',
  neptune: '/textures/2k_neptune.jpg',
} as const;

type TextureKey = keyof typeof texturePaths;
const tx = (k: TextureKey) => texturePaths[k];

// Preload textures for a smoother experience
(Object.keys(texturePaths) as TextureKey[]).forEach((k) => useTexture.preload(tx(k)));

// -----------------------------
// Planet Configuration
// -----------------------------
type PlanetConfig = {
  name: string;
  texture: TextureKey;
  clouds?: TextureKey;
  rings?: TextureKey;
  size: number;
  distance: number;
  speed: number;
  axialTilt?: number;
  inclination?: number;
};

// --- MODIFIED: Planet speeds are slowed, and sizes/distances are adjusted for more realism ---
const planetData: PlanetConfig[] = [
  { name: 'Mercury', texture: 'mercury', size: 0.38, distance: 14, speed: 0.21, inclination: 0.03 },
  { name: 'Venus', texture: 'venus', clouds: 'venusClouds', size: 0.95, distance: 18, speed: 0.12, inclination: 0.06 },
  { name: 'Mars', texture: 'mars', size: 0.53, distance: 28, speed: 0.065, axialTilt: 25.2, inclination: 0.03 },
  { name: 'Jupiter', texture: 'jupiter', size: 7.0, distance: 45, speed: 0.04, axialTilt: 3.1, inclination: 0.02 },
  { name: 'Saturn', texture: 'saturn', rings: 'saturnRings', size: 6.0, distance: 65, speed: 0.025, axialTilt: 26.7, inclination: 0.04 },
  { name: 'Uranus', texture: 'uranus', size: 2.5, distance: 80, speed: 0.015, axialTilt: 97.8, inclination: 0.01 },
  { name: 'Neptune', texture: 'neptune', size: 2.4, distance: 95, speed: 0.01, axialTilt: 28.3, inclination: 0.03 },
];

// -----------------------------
// 3D Components
// -----------------------------
function Sun() {
  const sunMap = useTexture(tx('sun'));
  sunMap.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh>
      {/* --- MODIFIED: Sun is significantly larger for a more realistic scale --- */}
      <sphereGeometry args={[14, 64, 64]} />
      <meshBasicMaterial map={sunMap} toneMapped={false} />
      <pointLight color={0xffdcb1} intensity={12000} distance={0} decay={2} />
    </mesh>
  );
}

function Rings({ alphaUrl, size }: { alphaUrl: string; size: number }) {
  const alpha = useTexture(alphaUrl);
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <ringGeometry args={[size * 1.2, size * 2.2, 128]} />
      <meshStandardMaterial
        transparent
        alphaMap={alpha}
        color="#ffffff"
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}

function Planet({ textureUrl, cloudsUrl, size, axialTilt = 0 }: { textureUrl: string; cloudsUrl?: string; size: number; axialTilt?: number }) {
  const planetRef = useRef<THREE.Group>(null!);
  const colorMap = useTexture(textureUrl);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const cloudsMap = cloudsUrl ? useTexture(cloudsUrl) : undefined;
  if (cloudsMap) cloudsMap.colorSpace = THREE.SRGBColorSpace;

  useEffect(() => {
    if (planetRef.current) planetRef.current.rotation.z = THREE.MathUtils.degToRad(axialTilt);
  }, [axialTilt]);

  // --- MODIFIED: Planet self-rotation is much slower ---
  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.03;
  });

  return (
    <group ref={planetRef}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial map={colorMap} metalness={0} roughness={0.8} />
      </mesh>
      {cloudsMap && (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[size * 1.01, 64, 64]} />
          <meshStandardMaterial map={cloudsMap} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function OrbitingBody({ children, distance, speed, inclination = 0 }: { children: ReactNode; distance: number; speed: number; inclination?: number }) {
  const orbitRef = useRef<THREE.Group>(null!);
  const inclinationRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (inclinationRef.current) inclinationRef.current.rotation.x = inclination;
  }, [inclination]);

  useFrame((state) => {
    if (orbitRef.current) orbitRef.current.rotation.y = state.clock.getElapsedTime() * speed;
  });

  const orbitPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * distance, 0, Math.sin(theta) * distance));
    }
    return points;
  }, [distance]);

  return (
    <group ref={inclinationRef}>
      <group ref={orbitRef}>
        <Line points={orbitPoints} color="white" lineWidth={1} transparent opacity={0.15} />
        <group position={[distance, 0, 0]}>{children}</group>
      </group>
    </group>
  );
}

function Comet() {
  const cometRef = useRef<THREE.Mesh>(null!);
  const [position, speed] = useMemo(() => {
    const pos = new THREE.Vector3(250, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 300);
    const spd = Math.random() * 60 + 40;
    return [pos, spd];
  }, []);

  useFrame((_, delta) => {
    cometRef.current.position.x -= delta * speed;
    if (cometRef.current.position.x < -250) {
      cometRef.current.position.x = 250;
      cometRef.current.position.y = (Math.random() - 0.5) * 150;
    }
  });

  return (
    <mesh ref={cometRef} position={position}>
      <coneGeometry args={[0.1, 4, 8]} />
      <meshBasicMaterial color="white" toneMapped={false} />
    </mesh>
  );
}

// Earth's new distance and speed constants
const EARTH_DISTANCE = 22;
const EARTH_SPEED = 0.075;
const ARRIVAL_SECONDS = 8;

function CameraRig() {
    const curve = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(120, 50, 180),
        new THREE.Vector3(80, 40, 120),
        new THREE.Vector3(50, 20, 70),
        new THREE.Vector3(30, 8, 28),
    ], false, 'catmullrom', 0.1), []);
  
    const tmp = useMemo(() => new THREE.Vector3(), []);
    const orbit = useMemo(() => new THREE.Vector3(), []);
    const earthWorldPos = useMemo(() => new THREE.Vector3(), []);
  
    useFrame((state, dt) => {
      const t = state.clock.getElapsedTime();
      const s = Math.min(t / ARRIVAL_SECONDS, 1);
      
      // --- MODIFIED: Earth's orbital angle calculation now uses the new constant ---
      const earthOrbitAngle = t * EARTH_SPEED;
      earthWorldPos.set(Math.cos(earthOrbitAngle) * EARTH_DISTANCE, 0, -Math.sin(earthOrbitAngle) * EARTH_DISTANCE);
  
      if (s < 1) {
        curve.getPoint(s, tmp);
        state.camera.position.lerp(tmp, 1 - Math.pow(0.001, dt));
        state.camera.lookAt(0, 0, 0);
      } else {
        // --- MODIFIED: Camera orbit speed is slower ---
        const orbitSpeed = 0.09;
        const r = 6; // Slightly wider orbit
        const ang = (t - ARRIVAL_SECONDS) * orbitSpeed;
        orbit.set(earthWorldPos.x + Math.cos(ang) * r, 2.5, earthWorldPos.z + Math.sin(ang) * r);
        state.camera.position.lerp(orbit, 1 - Math.pow(0.0015, dt));
        state.camera.lookAt(earthWorldPos);
      }
    });
  
    return null;
}

// -----------------------------
// Main Background Component
// -----------------------------
export default function SolarSystemBackground() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas
        camera={{ fov: 60, position: [120, 50, 180], near: 0.1, far: 2000 }}
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.25;
        }}
      >
        <color attach="background" args={['#000']} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <Stars radius={400} depth={50} count={9000} factor={5} saturation={0} fade speed={0.5} />
          
          <Comet />
          <Comet />
          <Comet />

          <Sun />

          {/* --- MODIFIED: Earth's distance and speed values are now slower --- */}
          <OrbitingBody distance={EARTH_DISTANCE} speed={EARTH_SPEED} inclination={0.01}>
            <Planet textureUrl={tx('earth')} cloudsUrl={tx('earthClouds')} size={1} axialTilt={23.5} />
            {/* --- MODIFIED: Moon's orbit is also slower --- */}
            <OrbitingBody distance={2.5} speed={0.4}>
              <Planet textureUrl={tx('moon')} size={0.27} />
            </OrbitingBody>
          </OrbitingBody>

          {planetData.map((data) => (
            <OrbitingBody key={data.name} distance={data.distance} speed={data.speed} inclination={data.inclination ?? 0}>
              <Planet
                textureUrl={tx(data.texture)}
                cloudsUrl={data.clouds ? tx(data.clouds) : undefined}
                size={data.size}
                axialTilt={data.axialTilt ?? 0}
              />
              {data.rings && <Rings alphaUrl={tx(data.rings)} size={data.size} />}
            </OrbitingBody>
          ))}
          
          <CameraRig />
          <Preload all />
        </Suspense>
        <Loader containerStyles={{ pointerEvents: 'none' }} />
      </Canvas>
    </div>
  );
}