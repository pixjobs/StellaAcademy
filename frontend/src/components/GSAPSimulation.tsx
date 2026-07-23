'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as math from 'mathjs';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface GSAPSimulationProps {
  conceptId: string;
  mass?: number;            // Gravity: 1 to 4
  refractiveIndex?: number; // Prism: 1 to 2.5
  gearRatio?: number;       // Gears: 1 to 3
  deltaV?: number;          // Trajectory: 1 to 2.5
  resistance?: number;      // Circuit: 10 to 1000
  frequency?: number;       // Waves: 1 to 5
  amplitude?: number;       // Waves: 10 to 60
  angle?: number;
  ratio?: number;
  timeScale?: number;
}

export default function GSAPSimulation({
  conceptId,
  mass = 1,
  refractiveIndex = 1.5,
  gearRatio = 2,
  deltaV = 1,
  resistance = 100,
  frequency = 2,
  amplitude = 35,
  angle = 45,
  ratio = 0.75,
  timeScale = 1,
}: GSAPSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous elements
    containerRef.current.innerHTML = '';
    const container = containerRef.current;

    const ctx = gsap.context(() => {
      if (conceptId === 'gravity') {
        // --- GRAVITY & FIELDS ANIMATION ---
        container.className = 'relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950';
        
        // Attractor size depends on mass
        const planetSize = 12 * Math.sqrt(mass);
        const planetGlow = 20 * mass;
        
        const planet = document.createElement('div');
        planet.className = 'absolute rounded-full bg-indigo-500 z-10 transition-all duration-300';
        planet.style.width = `${planetSize}px`;
        planet.style.height = `${planetSize}px`;
        planet.style.boxShadow = `0 0 ${planetGlow}px rgba(99,102,241,0.7)`;
        container.appendChild(planet);

        const ring1 = document.createElement('div');
        ring1.className = 'gravity-ring absolute w-20 h-20 border border-indigo-500/30 rounded-full';
        container.appendChild(ring1);

        const ring2 = document.createElement('div');
        ring2.className = 'gravity-ring absolute w-32 h-32 border border-indigo-500/20 rounded-full';
        container.appendChild(ring2);

        const orbitWrapper = document.createElement('div');
        orbitWrapper.id = 'satellite-orbit';
        orbitWrapper.className = 'absolute w-44 h-44 flex items-center justify-end pointer-events-none';
        
        const satellite = document.createElement('div');
        satellite.className = 'w-3 h-3 bg-slate-300 border border-slate-400 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)]';
        orbitWrapper.appendChild(satellite);
        container.appendChild(orbitWrapper);

        // Orbit speed scales up with mass (higher mass = faster orbit)
        const orbitDuration = 6 / Math.sqrt(mass);

        gsap.to('#satellite-orbit', {
          rotation: 360,
          duration: orbitDuration,
          ease: 'none',
          repeat: -1,
        });

        // Pulsing rings speed scales with mass
        gsap.to('.gravity-ring', {
          scale: 1.4,
          opacity: 0,
          duration: 2.2 / Math.sqrt(mass),
          stagger: 0.7 / Math.sqrt(mass),
          ease: 'power1.out',
          repeat: -1,
        });
      } else if (conceptId === 'prism') {
        // --- PRISM & LIGHT ANIMATION ---
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 400 200');
        svg.setAttribute('class', 'w-full h-full max-w-[320px]');
        container.appendChild(svg);

        // Glass Prism Polygon
        const prism = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        prism.setAttribute('points', '200,50 160,130 240,130');
        prism.setAttribute('fill', 'rgba(147, 197, 253, 0.05)');
        prism.setAttribute('stroke', 'rgba(147, 197, 253, 0.4)');
        prism.setAttribute('stroke-width', '1.5');
        svg.appendChild(prism);

        // White Light Beam
        const whiteBeam = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        whiteBeam.setAttribute('id', 'white-beam');
        whiteBeam.setAttribute('x1', '50');
        whiteBeam.setAttribute('y1', '110');
        whiteBeam.setAttribute('x2', '180');
        whiteBeam.setAttribute('y2', '90');
        whiteBeam.setAttribute('stroke', '#ffffff');
        whiteBeam.setAttribute('stroke-width', '2.5');
        whiteBeam.setAttribute('stroke-dasharray', '150');
        whiteBeam.setAttribute('stroke-dashoffset', '150');
        svg.appendChild(whiteBeam);

        // Refracted colors fanning out depends on refractiveIndex (higher = more spread)
        const baseOffset = 90;
        const spreadMultiplier = 12 * (refractiveIndex - 0.7);

        const colors = [
          { color: '#f87171', y2: (baseOffset - spreadMultiplier * 2.2).toString() },
          { color: '#fb923c', y2: (baseOffset - spreadMultiplier * 1.3).toString() },
          { color: '#fde047', y2: (baseOffset - spreadMultiplier * 0.4).toString() },
          { color: '#4ade80', y2: (baseOffset + spreadMultiplier * 0.4).toString() },
          { color: '#22d3ee', y2: (baseOffset + spreadMultiplier * 1.3).toString() },
          { color: '#a78bfa', y2: (baseOffset + spreadMultiplier * 2.2).toString() },
        ];

        colors.forEach((c) => {
          const beam = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          beam.setAttribute('class', 'spectrum-beam');
          beam.setAttribute('x1', '220');
          beam.setAttribute('y1', '90');
          beam.setAttribute('x2', '340');
          beam.setAttribute('y2', c.y2);
          beam.setAttribute('stroke', c.color);
          beam.setAttribute('stroke-width', '1.8');
          beam.setAttribute('stroke-dasharray', '150');
          beam.setAttribute('stroke-dashoffset', '150');
          svg.appendChild(beam);
        });

        const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
        tl.to('#white-beam', {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: 'power1.inOut',
        })
          .to(
            '.spectrum-beam',
            {
              strokeDashoffset: 0,
              duration: 1.4,
              stagger: 0.08,
              ease: 'power1.out',
            },
            '-=0.4'
          )
          .to(['#white-beam', '.spectrum-beam'], {
            opacity: 0,
            duration: 0.5,
          }, '+=1');
      } else if (conceptId === 'gears') {
        // --- GEAR RATIO ANIMATION ---
        container.className = 'relative w-full h-full flex items-center justify-center gap-4 bg-slate-950';

        // Gear sizes based on gearRatio
        const gear1Size = 24; // drive gear
        const gear2Size = 24 / gearRatio; // driven gear

        const gear1 = document.createElement('div');
        gear1.id = 'large-gear';
        gear1.className = 'border-4 border-dashed border-amber-500 rounded-full flex items-center justify-center relative shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300';
        gear1.style.width = `${gear1Size * 3.5}px`;
        gear1.style.height = `${gear1Size * 3.5}px`;
        const innerG1 = document.createElement('div');
        innerG1.className = 'w-6 h-6 border-2 border-amber-500/40 rounded-full';
        gear1.appendChild(innerG1);
        container.appendChild(gear1);

        const gear2 = document.createElement('div');
        gear2.id = 'small-gear';
        gear2.className = 'border-4 border-dashed border-amber-500 rounded-full flex items-center justify-center relative shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300';
        gear2.style.width = `${gear2Size * 3.5}px`;
        gear2.style.height = `${gear2Size * 3.5}px`;
        const innerG2 = document.createElement('div');
        innerG2.className = 'w-3 h-3 border border-amber-500/40 rounded-full';
        gear2.appendChild(innerG2);
        container.appendChild(gear2);

        gsap.to('#large-gear', {
          rotation: 360,
          duration: 6,
          ease: 'none',
          repeat: -1,
        });

        // Driven gear rotates counter-clockwise and faster by gearRatio multiplier
        gsap.to('#small-gear', {
          rotation: -360,
          duration: 6 / gearRatio,
          ease: 'none',
          repeat: -1,
        });
      } else if (conceptId === 'trajectory') {
        // --- ORBITAL TRAJECTORY ANIMATION ---
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 400 200');
        svg.setAttribute('class', 'w-full h-full');
        container.appendChild(svg);

        // Earth
        const earth = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        earth.setAttribute('cx', '80');
        earth.setAttribute('cy', '100');
        earth.setAttribute('r', '14');
        earth.setAttribute('fill', '#3b82f6');
        svg.appendChild(earth);

        // Mars
        const mars = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mars.setAttribute('cx', '320');
        mars.setAttribute('cy', '100');
        mars.setAttribute('r', '9');
        mars.setAttribute('fill', '#ef4444');
        svg.appendChild(mars);

        // Hohmann Ellipse curve depends on deltaV (higher deltaV = wider curve)
        const controlY = 30 - (deltaV - 1) * 20;

        const pathD = `M 80,100 C 140,${controlY} 260,${controlY} 320,100`;

        const trajPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trajPath.setAttribute('d', pathD);
        trajPath.setAttribute('fill', 'none');
        trajPath.setAttribute('stroke', 'rgba(255,255,255,0.15)');
        trajPath.setAttribute('stroke-width', '1.5');
        trajPath.setAttribute('stroke-dasharray', '5 4');
        svg.appendChild(trajPath);

        const activePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        activePath.setAttribute('id', 'traj-active');
        activePath.setAttribute('d', pathD);
        activePath.setAttribute('fill', 'none');
        activePath.setAttribute('stroke', '#fbbf24');
        activePath.setAttribute('stroke-width', '2');
        activePath.setAttribute('stroke-dasharray', '350');
        activePath.setAttribute('stroke-dashoffset', '350');
        svg.appendChild(activePath);

        const craft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        craft.setAttribute('id', 'spacecraft');
        craft.setAttribute('r', '4.5');
        craft.setAttribute('fill', '#fbbf24');
        craft.setAttribute('cx', '80');
        craft.setAttribute('cy', '100');
        svg.appendChild(craft);

        const pathData = { val: 0 };
        // Duration scales with deltaV (higher energy burn = faster travel)
        const travelDuration = 4 / deltaV;

        gsap.to(pathData, {
          val: 1,
          duration: travelDuration,
          ease: 'power1.inOut',
          repeat: -1,
          onUpdate: () => {
            const length = activePath.getTotalLength();
            const point = activePath.getPointAtLength(pathData.val * length);
            craft.setAttribute('cx', point.x.toString());
            craft.setAttribute('cy', point.y.toString());
            activePath.setAttribute('stroke-dashoffset', (350 - pathData.val * 350).toString());
          },
        });
      } else if (conceptId === 'circuit') {
        // --- CIRCUIT FLOW ANIMATION ---
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 150');
        svg.setAttribute('class', 'w-full h-full max-w-[280px]');
        container.appendChild(svg);

        const trace = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trace.setAttribute('id', 'circuit-trace');
        trace.setAttribute('d', 'M 40,30 L 260,30 L 260,120 L 40,120 Z');
        trace.setAttribute('fill', 'none');
        trace.setAttribute('stroke', 'rgba(16, 185, 129, 0.15)');
        trace.setAttribute('stroke-width', '2');
        svg.appendChild(trace);

        const resistor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        resistor.setAttribute('d', 'M 110,30 L 125,20 L 135,40 L 145,20 L 155,40 L 165,20 L 175,40 L 190,30');
        resistor.setAttribute('fill', 'none');
        resistor.setAttribute('stroke', '#a78bfa');
        resistor.setAttribute('stroke-width', '2');
        svg.appendChild(resistor);

        const led = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        led.setAttribute('points', '250,75 270,75 260,60');
        led.setAttribute('id', 'led-node');
        led.setAttribute('fill', 'none');
        led.setAttribute('stroke', '#10b981');
        led.setAttribute('stroke-width', '1.5');
        svg.appendChild(led);

        const ledLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ledLine.setAttribute('x1', '250');
        ledLine.setAttribute('y1', '60');
        ledLine.setAttribute('x2', '270');
        ledLine.setAttribute('y2', '60');
        ledLine.setAttribute('stroke', '#10b981');
        ledLine.setAttribute('stroke-width', '1.5');
        svg.appendChild(ledLine);

        const electronCount = 5;
        const electrons: SVGCircleElement[] = [];

        for (let i = 0; i < electronCount; i++) {
          const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          el.setAttribute('r', '3.5');
          el.setAttribute('fill', '#10b981');
          svg.appendChild(el);
          electrons.push(el);
        }

        // Velocity is inversely proportional to resistance (Ohm's Law: I = V/R)
        // High resistance = slower flow.
        const speedFactor = 100 / resistance; // baseline 100 ohms
        const cycleDuration = 5 / speedFactor;

        // LED opacity glows based on current flow strength (lower resistance = higher current = brighter LED)
        const ledBrightness = Math.max(0.2, Math.min(1.0, 150 / resistance));

        electrons.forEach((el, index) => {
          const flowData = { val: (index / electronCount) };
          gsap.to(flowData, {
            val: flowData.val + 1,
            duration: cycleDuration,
            ease: 'none',
            repeat: -1,
            onUpdate: () => {
              const normalVal = flowData.val % 1;
              const length = trace.getTotalLength();
              const point = trace.getPointAtLength(normalVal * length);
              el.setAttribute('cx', point.x.toString());
              el.setAttribute('cy', point.y.toString());

              if (point.x > 250 && point.y > 60 && point.y < 85) {
                gsap.to('#led-node', { fill: `rgba(16, 185, 129, ${ledBrightness})`, duration: 0.1 });
              } else {
                gsap.to('#led-node', { fill: 'none', duration: 0.3 });
              }
            },
          });
        });
      } else if (conceptId === 'waves') {
        // --- OSCILLOSCOPE WAVES ANIMATION ---
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden';

        const grid = document.createElement('div');
        grid.className = 'absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:20px_20px]';
        container.appendChild(grid);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 400 200');
        svg.setAttribute('class', 'w-full h-full absolute inset-0 z-10');
        container.appendChild(svg);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(g);

        const wave = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        wave.setAttribute('id', 'sine-wave');

        const pathArray = [];
        // Frequency changes spatial frequency (multiplier of x)
        const freqScale = 0.02 * frequency;
        
        for (let x = -100; x <= 500; x += 2) {
          // Amplitude affects height
          const y = 100 + Math.sin(x * freqScale) * amplitude;
          pathArray.push(`${x === -100 ? 'M' : 'L'} ${x} ${y}`);
        }
        wave.setAttribute('d', pathArray.join(' '));
        wave.setAttribute('fill', 'none');
        wave.setAttribute('stroke', '#10b981');
        wave.setAttribute('stroke-width', '2.5');
        wave.setAttribute('class', 'shadow-[0_0_10px_rgba(16,185,129,0.5)]');
        g.appendChild(wave);

        // Scroll wave horizontally
        const periodLength = (2 * Math.PI) / freqScale;
        gsap.to('#sine-wave', {
          x: -periodLength,
          duration: 4 / frequency,
          ease: 'none',
          repeat: -1,
        });
      } else if (conceptId === 'trigonometry') {
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 200');
        svg.setAttribute('class', 'w-full h-full');
        container.appendChild(svg);
        
        // Ground line
        const ground = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ground.setAttribute('x1', '20');
        ground.setAttribute('y1', '160');
        ground.setAttribute('x2', '280');
        ground.setAttribute('y2', '160');
        ground.setAttribute('stroke', '#475569');
        ground.setAttribute('stroke-width', '2');
        svg.appendChild(ground);

        // Triangle Path
        const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        triangle.setAttribute('id', 'trig-triangle');
        triangle.setAttribute('fill', 'rgba(245, 158, 11, 0.1)');
        triangle.setAttribute('stroke', '#f59e0b');
        triangle.setAttribute('stroke-width', '2');
        svg.appendChild(triangle);

        // Observer Node
        const observer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        observer.setAttribute('cx', '50');
        observer.setAttribute('cy', '160');
        observer.setAttribute('r', '4');
        observer.setAttribute('fill', '#3b82f6');
        svg.appendChild(observer);

        // Satellite Node
        const satellite = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        satellite.setAttribute('id', 'trig-satellite');
        satellite.setAttribute('r', '6');
        satellite.setAttribute('fill', '#f59e0b');
        svg.appendChild(satellite);

        // Animate the satellite moving, which updates the triangle
        const animData = { angle: 15 };
        
        gsap.to(animData, {
          angle: 75,
          duration: 4,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          onUpdate: () => {
            const rad = animData.angle * (Math.PI / 180);
            const hypotenuse = 140;
            const x = 50 + Math.cos(rad) * hypotenuse;
            const y = 160 - Math.sin(rad) * hypotenuse;
            
            satellite.setAttribute('cx', x.toString());
            satellite.setAttribute('cy', y.toString());
            
            // Triangle connects Observer (50, 160) -> Satellite (x, y) -> Ground projection (x, 160) -> Observer
            triangle.setAttribute('points', `50,160 ${x},${y} ${x},160`);
          }
        });
      } else if (conceptId === 'fractions') {
        container.className = 'relative w-full h-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden';
        
        const visual = document.createElement('div');
        visual.className = 'w-64 h-12 bg-slate-800 rounded-lg border border-slate-600 flex overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.2)]';
        container.appendChild(visual);

        const fuelPart = document.createElement('div');
        fuelPart.id = 'fraction-fuel';
        fuelPart.className = 'h-full bg-indigo-500 flex items-center justify-center text-xs font-bold font-mono text-white/90 border-r border-indigo-700/50';
        fuelPart.style.width = '75%';
        fuelPart.innerText = 'FUEL (3/4)';
        visual.appendChild(fuelPart);

        const payloadPart = document.createElement('div');
        payloadPart.id = 'fraction-payload';
        payloadPart.className = 'h-full bg-cyan-400 flex items-center justify-center text-xs font-bold font-mono text-slate-900';
        payloadPart.style.width = '25%';
        payloadPart.innerText = 'PAYLOAD';
        visual.appendChild(payloadPart);

        // Animate the fraction split
        const fracData = { fuel: 75 };
        gsap.to(fracData, {
          fuel: 20,
          duration: 3,
          yoyo: true,
          repeat: -1,
          ease: 'power1.inOut',
          onUpdate: () => {
            fuelPart.style.width = `${fracData.fuel}%`;
            payloadPart.style.width = `${100 - fracData.fuel}%`;
            fuelPart.innerText = `FUEL (${Math.round(fracData.fuel)}%)`;
          }
        });
      } else if (conceptId === 'calculus') {
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 200');
        svg.setAttribute('class', 'w-full h-full');
        container.appendChild(svg);

        // Curve path: y = x^2 mapping roughly
        const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curve.setAttribute('d', 'M 20,180 Q 150,180 280,20');
        curve.setAttribute('fill', 'none');
        curve.setAttribute('stroke', '#10b981');
        curve.setAttribute('stroke-width', '3');
        svg.appendChild(curve);

        // Tangent line
        const tangent = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tangent.setAttribute('id', 'calc-tangent');
        tangent.setAttribute('stroke', '#fbbf24');
        tangent.setAttribute('stroke-width', '2');
        tangent.setAttribute('stroke-dasharray', '4');
        svg.appendChild(tangent);

        const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttribute('id', 'calc-point');
        point.setAttribute('r', '5');
        point.setAttribute('fill', '#fbbf24');
        svg.appendChild(point);

        const calcData = { t: 0 };
        gsap.to(calcData, {
          t: 1,
          duration: 3,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          onUpdate: () => {
            const length = curve.getTotalLength();
            const p = curve.getPointAtLength(calcData.t * length);
            
            // Get derivative (approximate by sampling nearby point)
            const p2 = curve.getPointAtLength(Math.min(length, (calcData.t + 0.01) * length));
            const dx = p2.x - p.x;
            const dy = p2.y - p.y;
            
            // Tangent line endpoints
            const tLen = 40;
            const mag = Math.sqrt(dx*dx + dy*dy) || 1;
            const dirX = dx / mag;
            const dirY = dy / mag;
            
            tangent.setAttribute('x1', (p.x - dirX * tLen).toString());
            tangent.setAttribute('y1', (p.y - dirY * tLen).toString());
            tangent.setAttribute('x2', (p.x + dirX * tLen).toString());
            tangent.setAttribute('y2', (p.y + dirY * tLen).toString());
            
            point.setAttribute('cx', p.x.toString());
            point.setAttribute('cy', p.y.toString());
          }
        });
      } else if (conceptId === 'vectors') {
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 200');
        svg.setAttribute('class', 'w-full h-full');
        container.appendChild(svg);

        // Vector X
        const vecX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vecX.setAttribute('x1', '50');
        vecX.setAttribute('y1', '150');
        vecX.setAttribute('x2', '200');
        vecX.setAttribute('y2', '150');
        vecX.setAttribute('stroke', '#22d3ee');
        vecX.setAttribute('stroke-width', '2');
        vecX.setAttribute('stroke-dasharray', '5 3');
        svg.appendChild(vecX);

        // Vector Y
        const vecY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vecY.setAttribute('x1', '200');
        vecY.setAttribute('y1', '150');
        vecY.setAttribute('x2', '200');
        vecY.setAttribute('y2', '50');
        vecY.setAttribute('stroke', '#38bdf8');
        vecY.setAttribute('stroke-width', '2');
        vecY.setAttribute('stroke-dasharray', '5 3');
        svg.appendChild(vecY);

        // Total Vector
        const vecTotal = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vecTotal.setAttribute('id', 'vec-total');
        vecTotal.setAttribute('x1', '50');
        vecTotal.setAttribute('y1', '150');
        vecTotal.setAttribute('stroke', '#818cf8');
        vecTotal.setAttribute('stroke-width', '3');
        svg.appendChild(vecTotal);
        
        const data = { p: 0 };
        gsap.to(data, {
          p: 1,
          duration: 3,
          repeat: -1,
          ease: 'power2.inOut',
          onUpdate: () => {
            const currentX = 50 + (150 * data.p);
            const currentY = 150 - (100 * data.p);
            vecTotal.setAttribute('x2', currentX.toString());
            vecTotal.setAttribute('y2', currentY.toString());
          }
        });
      } else if (conceptId === 'matrices') {
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden';
        
        const grid = document.createElement('div');
        grid.className = 'absolute inset-0 flex items-center justify-center';
        container.appendChild(grid);

        // A wireframe cube / spacecraft shape
        const shape = document.createElement('div');
        shape.id = 'matrix-shape';
        shape.className = 'w-24 h-24 border-2 border-amber-500 rounded relative flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]';
        
        const inner = document.createElement('div');
        inner.className = 'w-0 h-0 border-l-[12px] border-l-transparent border-b-[24px] border-b-amber-400 border-r-[12px] border-r-transparent';
        shape.appendChild(inner);
        grid.appendChild(shape);

        gsap.to('#matrix-shape', {
          rotation: 360,
          duration: 8,
          ease: 'none',
          repeat: -1,
        });
      } else if (conceptId === 'probability') {
        container.className = 'relative w-full h-full flex gap-4 items-center justify-center bg-slate-950 overflow-hidden';
        
        const nodes: HTMLDivElement[] = [];
        for (let i = 0; i < 3; i++) {
          const node = document.createElement('div');
          node.className = 'w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors duration-300';
          container.appendChild(node);
          nodes.push(node);
        }

        const data = { tick: 0 };
        gsap.to(data, {
          tick: 1,
          duration: 2,
          repeat: -1,
          onRepeat: () => {
            // Randomly fail 1 node, keep other 2 alive
            nodes.forEach(n => {
              const fails = Math.random() < 0.2; // 20% fail rate
              if (fails) {
                n.className = 'w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors duration-300 bg-rose-500/20 border border-rose-500 text-rose-400';
                n.innerText = 'FAIL';
              } else {
                n.className = 'w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors duration-300 bg-emerald-500/20 border border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                n.innerText = 'OK';
              }
            });
          }
        });
      } else if (conceptId === 'diffeq') {
        container.className = 'relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 200');
        svg.setAttribute('class', 'w-full h-full');
        container.appendChild(svg);

        // Exponential decay curve
        const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curve.setAttribute('d', 'M 20,20 Q 50,180 280,180');
        curve.setAttribute('fill', 'none');
        curve.setAttribute('stroke', '#6366f1');
        curve.setAttribute('stroke-width', '3');
        svg.appendChild(curve);

        const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttribute('r', '6');
        point.setAttribute('fill', '#818cf8');
        point.setAttribute('class', 'shadow-[0_0_10px_rgba(99,102,241,0.8)]');
        svg.appendChild(point);

        const data = { t: 0 };
        gsap.to(data, {
          t: 1,
          duration: 4,
          repeat: -1,
          ease: 'power3.out', // Represents rapid deceleration leveling off
          onUpdate: () => {
            const length = curve.getTotalLength();
            const p = curve.getPointAtLength(data.t * length);
            point.setAttribute('cx', p.x.toString());
            point.setAttribute('cy', p.y.toString());
          }
        });
      } else if (['arithmetic', 'basic-geometry', 'proportions', 'decimals-percentages', 'binary', 'multiplication', 'fraction-ops', 'negative-numbers', 'exponents-roots'].includes(conceptId)) {
        const createFlashcardApp = (problems: {expr: string, steps: string[], ans: string}[]) => {
          container.className = 'relative w-full h-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden';
          
          const title = document.createElement('div');
          title.className = 'absolute top-4 text-slate-500 text-[10px] md:text-xs uppercase tracking-[0.2em] font-mono';
          title.innerText = 'Interactive Math Flashcards';
          container.appendChild(title);

          let currIndex = 0;
          let currStep = -1;

          const card = document.createElement('div');
          card.className = 'bg-slate-900 border border-slate-700 p-5 md:p-6 rounded-2xl shadow-xl flex flex-col items-center gap-6 w-[95%] max-w-sm transform-gpu mt-4';
          container.appendChild(card);

          const exprDisplay = document.createElement('div');
          exprDisplay.className = 'text-2xl md:text-3xl text-indigo-400 min-h-[50px] flex items-center justify-center text-center';
          katex.render(problems[currIndex].expr, exprDisplay, { throwOnError: false, displayMode: true });
          card.appendChild(exprDisplay);

          const inputRow = document.createElement('div');
          inputRow.className = 'flex gap-2 w-full';
          card.appendChild(inputRow);

          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'Answer...';
          input.className = 'flex-1 bg-slate-950 border border-slate-600 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-w-0';
          inputRow.appendChild(input);

          const btn = document.createElement('button');
          btn.innerText = 'Check';
          btn.className = 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-lg transition-colors font-mono';
          inputRow.appendChild(btn);

          const feedback = document.createElement('div');
          feedback.className = 'text-xs h-4 transition-opacity opacity-0 font-mono';
          card.appendChild(feedback);
          
          const showBreakdownBtn = document.createElement('button');
          showBreakdownBtn.innerText = 'Slowly Step Through';
          showBreakdownBtn.className = 'text-[10px] md:text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors font-mono';
          card.appendChild(showBreakdownBtn);

          const handleCheck = () => {
            const val = input.value.trim().toLowerCase();
            if (val === problems[currIndex].ans.toLowerCase()) {
              feedback.innerText = 'Correct! Great job.';
              feedback.className = 'text-xs h-4 transition-opacity opacity-100 text-emerald-400 font-mono';
              input.disabled = true;
              btn.disabled = true;
              
              gsap.to(card, {
                rotateY: 90,
                duration: 0.4,
                delay: 1,
                onComplete: () => {
                  currIndex = (currIndex + 1) % problems.length;
                  currStep = -1;
                  katex.render(problems[currIndex].expr, exprDisplay, { throwOnError: false, displayMode: true });
                  input.value = '';
                  input.disabled = false;
                  btn.disabled = false;
                  feedback.className = 'text-xs h-4 transition-opacity opacity-0 font-mono';
                  gsap.to(card, { rotateY: 0, duration: 0.4 });
                  input.focus();
                }
              });
            } else {
              feedback.innerText = 'Incorrect. Try again or check steps.';
              feedback.className = 'text-xs h-4 transition-opacity opacity-100 text-rose-400 font-mono';
              gsap.fromTo(card, { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 3, onComplete: () => gsap.set(card, {x: 0}) });
            }
          };

          btn.onclick = handleCheck;
          input.onkeydown = (e) => { if (e.key === 'Enter') handleCheck(); };

          showBreakdownBtn.onclick = () => {
            currStep++;
            const p = problems[currIndex];
            if (currStep < p.steps.length) {
              katex.render(p.steps[currStep], exprDisplay, { throwOnError: false, displayMode: true });
              gsap.fromTo(exprDisplay, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' });
            } else {
              input.value = p.ans;
              handleCheck();
            }
          };
        };

        if (conceptId === 'arithmetic') {
          createFlashcardApp([
            { expr: '8 - \\frac{4}{2} + (1 + 1)^2', steps: ['8 - \\frac{4}{2} + (2)^2', '8 - \\frac{4}{2} + 4', '8 - 2 + 4', '6 + 4', '10'], ans: '10' },
            { expr: '\\frac{4^2}{2}', steps: ['\\frac{16}{2}', '8'], ans: '8' },
            { expr: '(3 + 2) \\times 4', steps: ['5 \\times 4', '20'], ans: '20' },
            { expr: '10 - 2 \\times 3', steps: ['10 - 6', '4'], ans: '4' },
            { expr: '\\frac{12}{(4 - 1)}', steps: ['\\frac{12}{3}', '4'], ans: '4' }
          ]);
        } else if (conceptId === 'basic-geometry') {
          createFlashcardApp([
            { expr: '\\text{Area of Rectangle:} \\\\ w=5, h=4', steps: ['A = w \\times h', 'A = 5 \\times 4', '20'], ans: '20' },
            { expr: '\\text{Perimeter of Square:} \\\\ s=6', steps: ['P = 4 \\times s', 'P = 4 \\times 6', '24'], ans: '24' },
            { expr: '\\text{Area of Triangle:} \\\\ b=4, h=3', steps: ['A = \\frac{1}{2} b h', 'A = \\frac{1}{2}(4)(3)', 'A = \\frac{1}{2}(12)', '6'], ans: '6' },
            { expr: '\\text{Perimeter of Rectangle:} \\\\ w=7, h=2', steps: ['P = 2w + 2h', 'P = 2(7) + 2(2)', 'P = 14 + 4', '18'], ans: '18' }
          ]);
        } else if (conceptId === 'proportions') {
          createFlashcardApp([
            { expr: '\\frac{x}{4} = \\frac{15}{20}', steps: ['20x = 4 \\times 15', '20x = 60', 'x = \\frac{60}{20}', '3'], ans: '3' },
            { expr: '2 : 5 = 6 : x', steps: ['\\frac{2}{5} = \\frac{6}{x}', '2x = 30', 'x = 15'], ans: '15' },
            { expr: '\\frac{8}{12} = \\frac{x}{3}', steps: ['12x = 24', 'x = 2'], ans: '2' },
            { expr: '\\text{If } 3 \\text{ apples cost } \\$6, \\\\ \\text{cost of } 5 \\text{ apples?}', steps: ['\\frac{3}{6} = \\frac{5}{x}', '3x = 30', '10'], ans: '10' }
          ]);
        } else if (conceptId === 'decimals-percentages') {
          createFlashcardApp([
            { expr: '\\text{Convert } 0.75 \\text{ to } \\%', steps: ['0.75 \\times 100\\%', '75\\%'], ans: '75' },
            { expr: '\\text{Convert } \\frac{1}{4} \\text{ to } \\%', steps: ['\\frac{1}{4} = 0.25', '0.25 \\times 100\\%', '25\\%'], ans: '25' },
            { expr: '40\\% \\text{ of } 50', steps: ['0.40 \\times 50', '20'], ans: '20' },
            { expr: '\\text{Convert } 5\\% \\text{ to decimal}', steps: ['\\frac{5}{100}', '0.05'], ans: '0.05' }
          ]);
        } else if (conceptId === 'binary') {
          createFlashcardApp([
            { expr: '\\text{Convert } 1010_2 \\text{ to decimal}', steps: ['1(2^3) + 0(2^2) + 1(2^1) + 0(2^0)', '1(8) + 0(4) + 1(2) + 0(1)', '8 + 0 + 2 + 0', '10'], ans: '10' },
            { expr: '\\text{Convert } 111_2 \\text{ to decimal}', steps: ['1(4) + 1(2) + 1(1)', '4 + 2 + 1', '7'], ans: '7' },
            { expr: '\\text{Convert } 1000_2 \\text{ to decimal}', steps: ['1(2^3)', '8'], ans: '8' },
            { expr: '\\text{Convert } 1101_2 \\text{ to decimal}', steps: ['8 + 4 + 0 + 1', '13'], ans: '13' }
          ]);
        } else if (conceptId === 'multiplication') {
          createFlashcardApp([
            { expr: '24 \\times 3', steps: ['20 \\times 3 + 4 \\times 3', '60 + 12', '72'], ans: '72' },
            { expr: '15 \\times 6', steps: ['10 \\times 6 + 5 \\times 6', '60 + 30', '90'], ans: '90' },
            { expr: '14 \\times 12', steps: ['14 \\times 10 + 14 \\times 2', '140 + 28', '168'], ans: '168' },
            { expr: '23 \\times 11', steps: ['23 \\times 10 + 23 \\times 1', '230 + 23', '253'], ans: '253' },
            { expr: '17 \\times 5', steps: ['10 \\times 5 + 7 \\times 5', '50 + 35', '85'], ans: '85' }
          ]);
        } else if (conceptId === 'fraction-ops') {
          createFlashcardApp([
            { expr: '\\frac{1}{2} + \\frac{1}{3}', steps: ['\\text{LCD} = 6', '\\frac{3}{6} + \\frac{2}{6}', '\\frac{5}{6}'], ans: '5/6' },
            { expr: '\\frac{3}{4} - \\frac{1}{4}', steps: ['\\frac{3-1}{4}', '\\frac{2}{4}', '\\frac{1}{2}'], ans: '1/2' },
            { expr: '\\frac{2}{3} \\times \\frac{3}{4}', steps: ['\\frac{2 \\times 3}{3 \\times 4}', '\\frac{6}{12}', '\\frac{1}{2}'], ans: '1/2' },
            { expr: '\\frac{1}{2} \\div \\frac{1}{4}', steps: ['\\frac{1}{2} \\times \\frac{4}{1}', '\\frac{4}{2}', '2'], ans: '2' },
            { expr: '\\frac{2}{5} + \\frac{1}{10}', steps: ['\\text{LCD} = 10', '\\frac{4}{10} + \\frac{1}{10}', '\\frac{5}{10} = \\frac{1}{2}'], ans: '1/2' }
          ]);
        } else if (conceptId === 'negative-numbers') {
          createFlashcardApp([
            { expr: '-5 + 8', steps: ['\\text{Start at } -5, \\text{ move } 8 \\text{ right}', '3'], ans: '3' },
            { expr: '(-3) \\times (-4)', steps: ['\\text{Negative} \\times \\text{Negative} = \\text{Positive}', '12'], ans: '12' },
            { expr: '7 + (-10)', steps: ['7 - 10', '-3'], ans: '-3' },
            { expr: '(-6) \\div 2', steps: ['\\text{Negative} \\div \\text{Positive} = \\text{Negative}', '-3'], ans: '-3' },
            { expr: '|-8|', steps: ['\\text{Distance from zero}', '8'], ans: '8' }
          ]);
        } else if (conceptId === 'exponents-roots') {
          createFlashcardApp([
            { expr: '2^5', steps: ['2 \\times 2 \\times 2 \\times 2 \\times 2', '4 \\times 2 \\times 2 \\times 2', '8 \\times 2 \\times 2', '16 \\times 2', '32'], ans: '32' },
            { expr: '\\sqrt{81}', steps: ['? \\times ? = 81', '9 \\times 9 = 81', '9'], ans: '9' },
            { expr: '3^2 \\times 3^3', steps: ['3^{2+3}', '3^5', '243'], ans: '243' },
            { expr: '\\sqrt{49}', steps: ['7 \\times 7 = 49', '7'], ans: '7' },
            { expr: '(2^3)^2', steps: ['2^{3 \\times 2}', '2^6', '64'], ans: '64' }
          ]);
        }
      } else if (conceptId === 'angles') {
        container.className = 'relative w-full h-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '-100 -100 200 200');
        svg.setAttribute('class', 'w-64 h-64 overflow-visible');
        container.appendChild(svg);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '80');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', 'rgba(255,255,255,0.1)');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
        
        const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        wedge.setAttribute('fill', 'rgba(6,182,212,0.2)');
        wedge.setAttribute('stroke', '#06b6d4');
        wedge.setAttribute('stroke-width', '2');
        svg.appendChild(wedge);
        
        const label = document.createElement('div');
        label.className = 'absolute bottom-6 font-mono text-cyan-300 text-lg tracking-widest';
        container.appendChild(label);
        
        gsap.to({}, {
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          onUpdate: function() {
            const angle = this.progress() * Math.PI * 2; // 0 to 2PI
            const x = 80 * Math.cos(angle);
            const y = -80 * Math.sin(angle); // SVG y is down
            
            let pathData;
            if (angle === 0) {
              pathData = 'M 0 0 L 80 0';
            } else if (angle >= Math.PI * 1.999) {
              pathData = 'M 0 0 L 80 0 A 80 80 0 1 0 80 -0.01 Z';
            } else {
              const largeArcFlag = angle > Math.PI ? 1 : 0;
              // we need to draw from center (0,0) to start (80,0) then arc to (x,y) then back to center
              // wait, the path should be: Move to center, Line to start, Arc to end, Close (Z)
              pathData = `M 0 0 L 80 0 A 80 80 0 ${largeArcFlag} 0 ${x} ${y} Z`;
            }
            
            wedge.setAttribute('d', pathData);
            label.innerText = `θ = ${angle.toFixed(2)} rad`;
          }
        });
      }
    }, container);

    return () => ctx.revert();
  }, [conceptId, mass, refractiveIndex, gearRatio, deltaV, resistance, frequency, amplitude, angle, ratio, timeScale]);

  return <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border border-white/5 shadow-inner" />;
}
