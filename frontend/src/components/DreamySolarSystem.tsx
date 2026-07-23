'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DreamySolarSystem() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    // Soft dark space color
    scene.background = new THREE.Color('#030712');

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(50, 30, 70);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    // Light emitting from the Sun
    const sunLight = new THREE.PointLight(0xfff4e0, 3, 250, 0.8);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // --- TEXTURES ---
    const loader = new THREE.TextureLoader();
    
    const textures = {
      sun: loader.load('/textures/2k_sun.jpg'),
      mercury: loader.load('/textures/2k_mercury.jpg'),
      venus: loader.load('/textures/2k_venus_surface.jpg'),
      earth: loader.load('/textures/2k_earth_daymap.jpg'),
      earthClouds: loader.load('/textures/2k_earth_clouds.jpg'),
      moon: loader.load('/textures/2k_moon.jpg'),
      mars: loader.load('/textures/2k_mars.jpg'),
      jupiter: loader.load('/textures/2k_jupiter.jpg'),
      saturn: loader.load('/textures/2k_saturn.jpg'),
      saturnRings: loader.load('/textures/2k_saturn_ring_alpha.png'),
      uranus: loader.load('/textures/2k_uranus.jpg'),
      neptune: loader.load('/textures/2k_neptune.jpg'),
    };

    // Configure textures
    Object.values(textures).forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
    });

    // --- SUN ---
    const sunGeometry = new THREE.SphereGeometry(4.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: textures.sun });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    // --- ORBITS & PLANETS CONFIG ---
    interface PlanetData {
      name: string;
      size: number;
      distance: number;
      speed: number;
      texture: THREE.Texture;
      orbitColor: string;
      cloudsTexture?: THREE.Texture;
      ringsTexture?: THREE.Texture;
    }

    const planetsData: PlanetData[] = [
      { name: 'Mercury', size: 0.4, distance: 9, speed: 0.03, texture: textures.mercury, orbitColor: '#9ca3af' },
      { name: 'Venus', size: 0.8, distance: 13, speed: 0.02, texture: textures.venus, orbitColor: '#fde047' },
      {
        name: 'Earth',
        size: 0.9,
        distance: 18,
        speed: 0.015,
        texture: textures.earth,
        orbitColor: '#60a5fa',
        cloudsTexture: textures.earthClouds,
      },
      { name: 'Mars', size: 0.6, distance: 23, speed: 0.012, texture: textures.mars, orbitColor: '#f87171' },
      { name: 'Jupiter', size: 2.2, distance: 30, speed: 0.007, texture: textures.jupiter, orbitColor: '#fb923c' },
      {
        name: 'Saturn',
        size: 1.8,
        distance: 38,
        speed: 0.005,
        texture: textures.saturn,
        orbitColor: '#fef08a',
        ringsTexture: textures.saturnRings,
      },
      { name: 'Uranus', size: 1.2, distance: 46, speed: 0.003, texture: textures.uranus, orbitColor: '#22d3ee' },
      { name: 'Neptune', size: 1.1, distance: 54, speed: 0.002, texture: textures.neptune, orbitColor: '#818cf8' },
    ];

    interface PlanetInstance {
      group: THREE.Group;
      mesh: THREE.Mesh;
      speed: number;
      distance: number;
      cloudsMesh?: THREE.Mesh;
    }

    const planetInstances: PlanetInstance[] = [];

    planetsData.forEach((p) => {
      // 1. Create Orbit Line
      const points: THREE.Vector3[] = [];
      const orbitSegments = 128;
      for (let i = 0; i <= orbitSegments; i++) {
        const theta = (i / orbitSegments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * p.distance, 0, Math.sin(theta) * p.distance));
      }
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(p.orbitColor),
        transparent: true,
        opacity: 0.15,
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);

      // 2. Create Planet Group (for orbit rotation)
      const planetGroup = new THREE.Group();
      scene.add(planetGroup);

      // 3. Create Planet Mesh
      const geometry = new THREE.SphereGeometry(p.size, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        map: p.texture,
        roughness: 0.8,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = p.distance;
      planetGroup.add(mesh);

      // 4. Earth Clouds (if applicable)
      let cloudsMesh: THREE.Mesh | undefined;
      if (p.cloudsTexture) {
        const cloudsGeo = new THREE.SphereGeometry(p.size * 1.02, 32, 32);
        const cloudsMat = new THREE.MeshStandardMaterial({
          map: p.cloudsTexture,
          transparent: true,
          opacity: 0.45,
          blending: THREE.NormalBlending,
        });
        cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
        cloudsMesh.position.x = p.distance;
        planetGroup.add(cloudsMesh);
      }

      // 5. Saturn Rings (if applicable)
      if (p.ringsTexture) {
        const ringGeo = new THREE.RingGeometry(p.size * 1.3, p.size * 2.3, 64);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshStandardMaterial({
          alphaMap: p.ringsTexture,
          transparent: true,
          color: 0xdddddd,
          side: THREE.DoubleSide,
          opacity: 0.7,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.x = p.distance;
        planetGroup.add(ringMesh);
      }

      // 6. Moon (for Earth)
      if (p.name === 'Earth') {
        const moonGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ map: textures.moon, roughness: 0.9 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        // Place relative to Earth
        moonMesh.position.set(p.distance + 1.6, 0.2, 0);
        // Add to planetGroup directly so it orbits with Earth
        planetGroup.add(moonMesh);
      }

      planetInstances.push({
        group: planetGroup,
        mesh,
        speed: p.speed,
        distance: p.distance,
        cloudsMesh,
      });
    });

    // --- TWINKLING STARFIELD ---
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 6000;
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    const colors = [
      new THREE.Color('#93c5fd'), // soft blue
      new THREE.Color('#fdba74'), // soft orange
      new THREE.Color('#fef08a'), // soft yellow
      new THREE.Color('#ffffff'), // white
    ];

    for (let i = 0; i < starsCount; i++) {
      const radius = 150 + Math.random() * 450;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = colors[Math.floor(Math.random() * colors.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // --- MOUSE PARALLAX SETUP ---
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // 1. Rotate Starfield
      starField.rotation.y = elapsed * 0.005;
      starField.rotation.x = elapsed * 0.002;
      starsMaterial.opacity = 0.5 + Math.sin(elapsed * 1.5) * 0.25;

      // 2. Rotate Sun
      sunMesh.rotation.y = elapsed * 0.02;

      // 3. Update Planets (orbits and self-rotation)
      planetInstances.forEach((inst) => {
        // Orbit rotation
        inst.group.rotation.y = elapsed * inst.speed * 10;
        
        // Self-rotation of the planet
        inst.mesh.rotation.y = elapsed * 0.15;

        // Clouds rotation (slightly faster)
        if (inst.cloudsMesh) {
          inst.cloudsMesh.rotation.y = elapsed * 0.19;
        }
      });

      // 4. Dreamy Cinematic Camera Movement + Mouse Parallax
      const targetCamX = Math.cos(elapsed * 0.03) * 60 + mouseX * 20;
      const targetCamZ = Math.sin(elapsed * 0.03) * 60 + mouseX * 20;
      const targetCamY = 28 + Math.sin(elapsed * 0.06) * 8 - mouseY * 15;

      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;

      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      // Dispose resources
      scene.clear();
      sunGeometry.dispose();
      sunMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      renderer.dispose();
      Object.values(textures).forEach((t) => t.dispose());
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />;
}
