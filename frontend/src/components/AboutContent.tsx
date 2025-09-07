'use client';

import { useState, useEffect, useRef, useMemo, Suspense, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Line, Preload, useTexture, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { BrainCircuit, Telescope, Rocket, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// -----------------------------
// Asset base path (handles deployments behind a sub-path)
// Set NEXT_PUBLIC_BASE_PATH="/your-base-path" in env if needed.
// -----------------------------
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// -----------------------------
// Texture registry (served from /public)
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
const tx = (k: TextureKey) => `${BASE_PATH}${texturePaths[k]}`;

// Preload all textures up-front for smoother first render
(Object.keys(texturePaths) as TextureKey[]).forEach((k) => useTexture.preload(tx(k)));

// -----------------------------
// Planet config (typed)
// -----------------------------
type PlanetConfig = {
  name: string;
  texture: TextureKey;
  clouds?: TextureKey;
  rings?: TextureKey;
  size: number;       // relative radius
  distance: number;   // orbit radius
  speed: number;      // angular speed
  axialTilt?: number; // degrees
  inclination?: number; // radians
};

const planetData: PlanetConfig[] = [
  { name: 'Mercury', texture: 'mercury', size: 0.38, distance: 8, speed: 0.4, inclination: 0.03 },
  { name: 'Venus', texture: 'venus', clouds: 'venusClouds', size: 0.95, distance: 12, speed: 0.25, inclination: 0.06 },
  { name: 'Mars', texture: 'mars', size: 0.53, distance: 22, speed: 0.13, axialTilt: 25.2, inclination: 0.03 },
  { name: 'Jupiter', texture: 'jupiter', size: 4.5, distance: 35, speed: 0.08, axialTilt: 3.1, inclination: 0.02 },
  { name: 'Saturn', texture: 'saturn', rings: 'saturnRings', size: 3.8, distance: 55, speed: 0.05, axialTilt: 26.7, inclination: 0.04 },
  { name: 'Uranus', texture: 'uranus', size: 2.1, distance: 75, speed: 0.03, axialTilt: 97.8, inclination: 0.01 },
  { name: 'Neptune', texture: 'neptune', size: 2.0, distance: 90, speed: 0.02, axialTilt: 28.3, inclination: 0.03 },
];

// -----------------------------
// 3D Pieces
// -----------------------------
function Sun() {
  const sunMap = useTexture(tx('sun'));
  sunMap.colorSpace = THREE.SRGBColorSpace;
  sunMap.anisotropy = 8;
  return (
    <mesh>
      <sphereGeometry args={[5.5, 64, 64]} />
      {/* Basic material so the sun stays bright regardless of lights */}
      <meshBasicMaterial map={sunMap} toneMapped={false} />
      {/* Add a subtle glow to the sun */}
      <pointLight
        color={0xffffff}
        intensity={1}
        distance={7}
        decay={2}
      />
    </mesh>
  );
}

function Rings({ alphaUrl, size }: { alphaUrl: string; size: number }) {
  const alpha = useTexture(alphaUrl);
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow>
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

function Planet({
  textureUrl,
  cloudsUrl,
  size,
  axialTilt = 0,
}: {
  textureUrl: string;
  cloudsUrl?: string;
  size: number;
  axialTilt?: number;
}) {
  const planetRef = useRef<THREE.Group>(null!);
  const { gl } = useThree();

  const colorMap = useTexture(textureUrl);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy?.() ?? 8);

  const cloudsMap = cloudsUrl ? useTexture(cloudsUrl) : undefined;
  if (cloudsMap) {
    cloudsMap.colorSpace = THREE.SRGBColorSpace;
    cloudsMap.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy?.() ?? 8);
  }

  // Set axial tilt
  useEffect(() => {
    if (planetRef.current) planetRef.current.rotation.z = THREE.MathUtils.degToRad(axialTilt);
  }, [axialTilt]);

  // Self-rotation
  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.1;
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

function OrbitingBody({
  children,
  distance,
  speed,
  inclination = 0,
}: {
  children: ReactNode;
  distance: number;
  speed: number;
  inclination?: number;
}) {
  const orbitRef = useRef<THREE.Group>(null!);
  const inclinationRef = useRef<THREE.Group>(null!);

  // Apply inclination
  useEffect(() => {
    if (inclinationRef.current) inclinationRef.current.rotation.x = inclination;
  }, [inclination]);

  // Orbit rotation
  useFrame((state, delta) => {
    if (orbitRef.current) {
        // Use elapsed time for consistent positioning regardless of frame rate
        orbitRef.current.rotation.y = state.clock.getElapsedTime() * speed;
    }
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

// -----------------------------
// Camera Rig (cinematic fly-in -> gentle Earth orbit)
// -----------------------------
const EARTH_DISTANCE = 17;
const ARRIVAL_SECONDS = 8; // synced with hero text reveal

function CameraRig() {
  const earthPosition = useMemo(() => new THREE.Vector3(EARTH_DISTANCE, 0, 0), []);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(100, 40, 150), // start far
          new THREE.Vector3(60, 30, 90),
          new THREE.Vector3(40, 15, 50),
          new THREE.Vector3(25, 6, 20),
        ],
        false,
        'catmullrom',
        0.1
      ),
    []
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const orbit = useMemo(() => new THREE.Vector3(), []);
  const earthWorldPos = useMemo(() => new THREE.Vector3(), []);


  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    const s = Math.min(t / ARRIVAL_SECONDS, 1);
    
    // Calculate Earth's current world position based on its orbit
    const earthOrbitAngle = t * 0.15; // Earth's speed
    earthWorldPos.set(
        Math.cos(earthOrbitAngle) * EARTH_DISTANCE,
        0,
        -Math.sin(earthOrbitAngle) * EARTH_DISTANCE
    );

    if (s < 1) {
      curve.getPoint(s, tmp);
      state.camera.position.lerp(tmp, 1 - Math.pow(0.001, dt));
      state.camera.lookAt(0, 0, 0);
    } else {
      const orbitSpeed = 0.18;
      const r = 5;
      const ang = (t - ARRIVAL_SECONDS) * orbitSpeed;
      orbit.set(earthWorldPos.x + Math.cos(ang) * r, 2, earthWorldPos.z + Math.sin(ang) * r);
      state.camera.position.lerp(orbit, 1 - Math.pow(0.0015, dt));
      state.camera.lookAt(earthWorldPos);
    }
  });

  return null;
}

// -----------------------------
// Content block
// -----------------------------
function ContentSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="content-section grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-8 md:gap-12 py-8 md:py-12">
      {icon && <div className="anim-child hidden md:block justify-self-center">{icon}</div>}
      <div className="anim-child prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-lg bg-background/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">{title}</h2>
        {subtitle && <p className="text-xl text-gold !-mt-2 !mb-6">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

// -----------------------------
// Main Component
// -----------------------------
export default function AboutContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  useGSAP(
    () => {
      gsap.from('.hero-text', {
        duration: 1.5,
        y: 50,
        autoAlpha: 0,
        ease: 'power3.out',
        delay: ARRIVAL_SECONDS,
        stagger: 0.3,
      });

      gsap.utils.toArray<HTMLElement>('.content-section').forEach((section) => {
        gsap.from(section.querySelectorAll('.anim-child'), {
          y: 50,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 85%' },
        });
      });

      gsap.from('.tech-card', {
        scale: 0.9,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.tech-grid', start: 'top 80%' },
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="relative text-foreground bg-black">
      {isClient && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Canvas
            camera={{ fov: 60, position: [100, 40, 150], near: 0.1, far: 2000 }} // Increased far plane
            dpr={[1, 2]}
            shadows
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.15;
            }}
          >
            <color attach="background" args={['#000']} />
            <Suspense fallback={null}>
              <ambientLight intensity={0.2} />

              <pointLight
                color={0xffdcb1}
                position={[0, 0, 0]}
                intensity={10000}
                distance={0}
                decay={2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-bias={-0.0001}
              />

              <Stars radius={400} depth={50} count={9000} factor={5} saturation={0} fade speed={1} />

              <Sun />

              <OrbitingBody distance={EARTH_DISTANCE} speed={0.15} inclination={0.01}>
                <Planet textureUrl={tx('earth')} cloudsUrl={tx('earthClouds')} size={1} axialTilt={23.5} />
                <OrbitingBody distance={2.5} speed={0.8}>
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
      )}

      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <section className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="hero-text">
            <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl text-gold mb-6">About Stella Academy</h1>
            </div>
            
            <div className="hero-text">
                <p className="text-lg sm:text-xl md:text-2xl max-w-3xl text-foreground/90 leading-relaxed">
                Your Personal Gateway to the Cosmos.
                </p>
            </div>
        </section>

          {/* --- CONTENT --- */}
          <ContentSection icon={<Sparkles className="w-12 h-12 text-gold" />} title="Our Mission">
            <p>
                Our mission is to make learning about the cosmos fun, accessible, and deeply realistic. By integrating new AI technologies, we are breaking down the barriers between complex science and pure wonder, moving beyond static textbooks to create an interactive adventure of discovery.
            </p>
            <p>
                We believe that knowledge should be as boundless as space itself. As we grow, our aspiration is to become a non-profit organization dedicated to supporting education and empowering the next generation of explorers. Stella Academy is our first step toward that future.
            </p>
          </ContentSection>

          <section className="content-section py-8 md:py-12">
            <div className="text-center">
              <h2 className="anim-child text-3xl sm:text-4xl font-bold mb-2 text-foreground">The Stella Engine</h2>
              <p className="anim-child text-xl text-gold !-mt-2 !mb-8">A Symphony of Data and Dialogue</p>
            </div>
            <div className="tech-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="tech-card rounded-2xl border border-white/10 bg-card/50 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-4">
                  <BrainCircuit className="w-10 h-10 text-sky-400 flex-shrink-0" />
                  <h3 className="text-xl font-bold text-sky-400">The Brains: GPT-OSS</h3>
                </div>
                <p className="text-sm text-foreground/80">
                  At our core is Stella, a personal AI guide powered by a 20-billion parameter open-source LLM. She isn't just a search
                  engine; she's a Socratic partner. Ask her to explain a formula simply, quiz you on a concept, or dream up a "what if"
                  scenario. By building on open-source, we ensure our tools for learning remain transparent and community-driven.
                </p>
              </div>
              <div className="tech-card rounded-2xl border border-white/10 bg-card/50 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-4">
                  <Telescope className="w-10 h-10 text-emerald-400 flex-shrink-0" />
                  <h3 className="text-xl font-bold text-emerald-400">The Eyes: NASA's API</h3>
                </div>
                <p className="text-sm text-foreground/80">
                  Knowledge needs a window to reality. We stream the cosmos to your screen via a live connection to NASA's Open APIs. The
                  images you explore are not stock photos; they are authentic, up-to-the-minute dispatches from humanity's greatest
                  scientific instruments. This is a living textbook, where the pages turn with every new discovery.
                </p>
              </div>
            </div>
          </section>

          <ContentSection icon={<Rocket className="w-12 h-12 text-gold" />} title="Our Vision" subtitle="Launching the Next Generation">
            <p>
              We envision a future where curiosity is the only prerequisite for exploration. A future where a student in any classroom has
              the same access to cosmic knowledge as a researcher at mission control. We are building a platform to spark that initial
              flicker of wonder and fan it into a lifelong flame of discovery.
            </p>
            <p>
              Stella Academy is our first step toward that future—a global, open-source classroom for the final frontier, empowering the next
              generation of scientists, engineers, artists, and thinkers.
            </p>
            <p className="font-pixel text-gold text-lg mt-6">The universe is calling. We're here to help you answer.</p>
          </ContentSection>

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}