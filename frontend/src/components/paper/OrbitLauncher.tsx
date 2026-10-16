'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';

// Real Earth values. The simulation itself runs in units where Earth's radius = 1 and GM = 1.
const EARTH_RADIUS_KM = 6371;
const GM_KM3_S2 = 398600.4;
const LAUNCH_ALTITUDE_KM = 2000;
const R0 = (EARTH_RADIUS_KM + LAUNCH_ALTITUDE_KM) / EARTH_RADIUS_KM; // launch distance from Earth's centre
const SPEED_UNIT_KMS = Math.sqrt(GM_KM3_S2 / EARTH_RADIUS_KM); // one simulation speed unit in km/s
const TIME_UNIT_S = EARTH_RADIUS_KM / SPEED_UNIT_KMS; // one simulation time unit in seconds
const CIRCULAR_KMS = Math.sqrt(GM_KM3_S2 / (EARTH_RADIUS_KM + LAUNCH_ALTITUDE_KM)); // 6.90 km/s
const ESCAPE_KMS = CIRCULAR_KMS * Math.SQRT2; // 9.76 km/s

// Stage, in canvas units.
const W = 600;
const H = 440;
const CX = W / 2;
const MAX_SCALE = 104; // pixels per Earth radius when zoomed right in
const SIM_UNITS_PER_SECOND = 1.35; // a circular orbit takes about seven seconds to watch
const SPEED_UP = Math.round((SIM_UNITS_PER_SECOND * TIME_UNIT_S) / 100) * 100;

type Outcome = 'crash' | 'low-ellipse' | 'circular' | 'high-ellipse' | 'escape';

/** What the launch speed leads to, worked out from the orbit equation rather than by watching. */
function predict(speedKms: number) {
  const k = speedKms / CIRCULAR_KMS; // launch speed as a multiple of circular speed
  const k2 = k * k;
  let outcome: Outcome;
  let other = Infinity; // the orbit's other extreme distance, in Earth radii
  if (k2 >= 2) outcome = 'escape';
  else {
    other = (R0 * k2) / (2 - k2);
    if (Math.abs(k - 1) < 0.012) outcome = 'circular';
    else if (k < 1) outcome = other < 1 ? 'crash' : 'low-ellipse';
    else outcome = 'high-ellipse';
  }
  const semiMajorKm = outcome === 'escape' ? Infinity : ((R0 + other) / 2) * EARTH_RADIUS_KM;
  const periodMin = Number.isFinite(semiMajorKm) ? (2 * Math.PI * Math.sqrt(semiMajorKm ** 3 / GM_KM3_S2)) / 60 : Infinity;
  return { k, k2, outcome, other, periodMin };
}

/** Zoom and vertical centre that keep the whole orbit in view. */
function framing(k2: number): { scale: number; cy: number } {
  if (k2 >= 2) return { scale: 24, cy: H * 0.5 };
  const other = (R0 * k2) / (2 - k2);
  if (other < 1) return { scale: MAX_SCALE, cy: H * 0.56 };
  const far = Math.min(other, 12);
  const scale = Math.min(MAX_SCALE, (H - 56) / (R0 + far), (W - 60) / (2 * Math.sqrt(R0 * far)));
  return { scale, cy: H / 2 - (scale * (far - R0)) / 2 };
}

const km = (n: number) => `${Math.round(n).toLocaleString('en-GB')} km`;

function describe(p: ReturnType<typeof predict>): { title: string; body: string } {
  switch (p.outcome) {
    case 'crash':
      return { title: 'Falls back to Earth', body: 'Too slow. Gravity pulls it down into the ground before it can get all the way round.' };
    case 'low-ellipse':
      return {
        title: 'A low, stretched orbit',
        body: `A little slow, so it dips to ${km((p.other - 1) * EARTH_RADIUS_KM)} above the ground on the far side, then climbs back.`,
      };
    case 'circular':
      return { title: 'A circular orbit', body: 'Just right. It is still falling, but the ground curves away beneath it at the same rate, so its height never changes.' };
    case 'high-ellipse':
      return {
        title: 'A long ellipse',
        body: `Faster than it needs, so it swings out to ${km((p.other - 1) * EARTH_RADIUS_KM)} before gravity brings it back.`,
      };
    case 'escape':
      return { title: 'Escapes Earth', body: 'This is escape velocity. Gravity keeps slowing it down but never manages to bring it back.' };
  }
}

const PRESETS = [
  { label: 'Too slow', speed: 6.0 },
  { label: 'Circular', speed: Number(CIRCULAR_KMS.toFixed(1)) },
  { label: 'Ellipse', speed: 7.8 },
  { label: 'Escape', speed: 9.8 },
];

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-0.5 font-fraunces text-xl font-semibold leading-tight text-white sm:text-2xl">{value}</div>
    </div>
  );
}

/**
 * A launch in three parts: real footage of lift-off, real footage of the climb,
 * then Newton's cannonball, a satellite released sideways 2,000 km up, to show
 * what the chosen speed leads to. The motion is integrated from the inverse-square law;
 * the dashed path and the outcome come from the orbit equation.
 */
type Phase = 'pad' | 'liftoff' | 'climb' | 'orbit';

const LIFTOFF_SECONDS = 9;
const CLIMB_SECONDS = 8.5;

/** `bare`: inside a Try it panel that already has its frame (the Explore tab on a quiz lesson). */
export default function OrbitLauncher({ placement = 'hero', bare = false }: { placement?: string; bare?: boolean }) {
  const [speed, setSpeed] = useState(Number(CIRCULAR_KMS.toFixed(1)));
  const [live, setLive] = useState({ altitude: LAUNCH_ALTITUDE_KM, speed: Number(CIRCULAR_KMS.toFixed(1)) });
  const [phase, setPhase] = useState<Phase>('pad');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liftoffRef = useRef<HTMLVideoElement>(null);
  const climbRef = useRef<HTMLVideoElement>(null);
  const phaseRef = useRef<Phase>('pad');
  const timer = useRef<number | undefined>(undefined);
  const speedRef = useRef(speed);
  const launchId = useRef(0);
  const used = useRef(false);

  const prediction = predict(speed);
  const words = describe(prediction);

  const choose = (next: number) => {
    setSpeed(next);
    speedRef.current = next;
    launchId.current += 1; // tells the loop to start a fresh launch
    if (!used.current) {
      used.current = true;
      track('orbit_launcher_used', { placement });
    }
  };

  const go = (next: Phase) => {
    window.clearTimeout(timer.current);
    phaseRef.current = next;
    setPhase(next);
  };

  /** Play a clip, and move on when it ends, or shortly after it should have if it cannot play. */
  const show = (video: HTMLVideoElement | null, during: Phase, seconds: number, then: () => void) => {
    go(during);
    const next = () => {
      if (phaseRef.current === during) then();
    };
    timer.current = window.setTimeout(next, (seconds + 4) * 1000);
    if (!video) return next();
    video.currentTime = 0;
    video.play().catch(next);
  };

  const enterOrbit = () => {
    launchId.current += 1; // start the simulated flight from the top
    go('orbit');
  };
  const startClimb = () => show(climbRef.current, 'climb', CLIMB_SECONDS, enterOrbit);

  const launchRocket = () => {
    track('rocket_launched', { placement, speed });
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
    if (still) return enterOrbit();
    climbRef.current?.load(); // fetch the second clip while the first plays
    show(liftoffRef.current, 'liftoff', LIFTOFF_SECONDS, startClimb);
  };

  const backToPad = () => {
    liftoffRef.current?.pause();
    climbRef.current?.pause();
    go('pad');
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');

    let x = 0, y = -R0, vx = 0, vy = 0;
    let trail: [number, number][] = [];
    let state: 'flying' | 'crashed' | 'gone' = 'flying';
    let pause = 0;
    let seen = -1;
    let { scale, cy } = framing((speedRef.current / CIRCULAR_KMS) ** 2);

    const launch = () => {
      const k = speedRef.current / CIRCULAR_KMS;
      x = 0;
      y = -R0;
      vx = k * Math.sqrt(1 / R0);
      vy = 0;
      trail = [];
      state = 'flying';
      pause = 0;
      seen = launchId.current;
    };

    const toPx = (px: number, py: number): [number, number] => [CX + px * scale, cy + py * scale];

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const k2 = (speedRef.current / CIRCULAR_KMS) ** 2;

      // Launch height, as a faint ring.
      ctx.setLineDash([2, 7]);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(CX, cy, R0 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Predicted path from the orbit equation r = p / (1 + (k² − 1) cos φ), φ measured from the launch point.
      ctx.setLineDash([6, 7]);
      ctx.strokeStyle = 'rgba(246,196,83,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 360; i++) {
        const phi = (i / 360) * Math.PI * 2;
        const denom = 1 + (k2 - 1) * Math.cos(phi);
        if (denom <= 0.02) { started = false; continue; }
        const r = (R0 * k2) / denom;
        if (r < 1 || r > 30) { started = false; continue; }
        // φ = 0 is straight up; the satellite travels clockwise on screen.
        const [sx, sy] = toPx(r * Math.sin(phi), -r * Math.cos(phi));
        if (started) ctx.lineTo(sx, sy);
        else { ctx.moveTo(sx, sy); started = true; }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Earth: atmosphere glow, then the globe.
      const glow = ctx.createRadialGradient(CX, cy, scale * 0.96, CX, cy, scale * 1.2);
      glow.addColorStop(0, 'rgba(96,165,250,0.55)');
      glow.addColorStop(1, 'rgba(96,165,250,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(CX, cy, scale * 1.2, 0, Math.PI * 2);
      ctx.fill();
      const globe = ctx.createRadialGradient(CX - scale * 0.32, cy - scale * 0.38, scale * 0.1, CX, cy, scale);
      globe.addColorStop(0, '#7dd3fc');
      globe.addColorStop(0.55, '#2563eb');
      globe.addColorStop(1, '#172554');
      ctx.fillStyle = globe;
      ctx.beginPath();
      ctx.arc(CX, cy, scale, 0, Math.PI * 2);
      ctx.fill();

      // Trail, brightest at the satellite.
      for (let i = 1; i < trail.length; i++) {
        const a = (i / trail.length) ** 1.6;
        ctx.strokeStyle = `rgba(255,255,255,${0.85 * a})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(...toPx(...trail[i - 1]));
        ctx.lineTo(...toPx(...trail[i]));
        ctx.stroke();
      }

      // Satellite, or the mark where it came down.
      const [sx, sy] = toPx(x, y);
      if (state === 'crashed') {
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx - 7, sy - 7); ctx.lineTo(sx + 7, sy + 7);
        ctx.moveTo(sx + 7, sy - 7); ctx.lineTo(sx - 7, sy + 7);
        ctx.stroke();
      } else if (state === 'flying') {
        ctx.fillStyle = 'rgba(246,196,83,0.3)';
        ctx.beginPath();
        ctx.arc(sx, sy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f6c453';
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (dt: number) => {
      // Velocity Verlet under an inverse-square pull towards the origin (GM = 1).
      const n = Math.max(1, Math.ceil(dt / 0.002));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        let r3 = Math.hypot(x, y) ** 3;
        let ax = -x / r3, ay = -y / r3;
        vx += ax * h * 0.5; vy += ay * h * 0.5;
        x += vx * h; y += vy * h;
        r3 = Math.hypot(x, y) ** 3;
        ax = -x / r3; ay = -y / r3;
        vx += ax * h * 0.5; vy += ay * h * 0.5;
        const r = Math.hypot(x, y);
        if (r <= 1) { state = 'crashed'; return; }
        if (r > 16) { state = 'gone'; return; }
      }
    };

    launch();
    if (still) {
      draw();
      // Without animation the dashed path is the answer; redraw it when the speed changes.
      const id = window.setInterval(() => {
        if (seen === launchId.current) return;
        launch();
        ({ scale, cy } = framing((speedRef.current / CIRCULAR_KMS) ** 2));
        draw();
      }, 200);
      return () => window.clearInterval(id);
    }

    let frame = 0;
    let last = performance.now();
    let sinceReadout = 0;
    const tick = (now: number) => {
      const dtReal = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (seen !== launchId.current) launch();
      // Ease the camera towards a framing that fits the whole orbit.
      const target = framing((speedRef.current / CIRCULAR_KMS) ** 2);
      const ease = 1 - Math.exp(-dtReal * 5);
      scale += (target.scale - scale) * ease;
      cy += (target.cy - cy) * ease;
      if (state === 'flying') {
        // Far from Earth everything happens slowly, so let time run faster out there.
        const warp = Math.min(Math.max(Math.hypot(x, y) / 2.5, 1), 6);
        step(dtReal * SIM_UNITS_PER_SECOND * warp);
        trail.push([x, y]);
        if (trail.length > 420) trail.shift();
      } else {
        pause += dtReal;
        if (pause > (state === 'crashed' ? 1.6 : 0.8)) launch();
      }
      draw();
      sinceReadout += dtReal;
      if (sinceReadout > 0.12) {
        sinceReadout = 0;
        const r = Math.hypot(x, y);
        setLive({ altitude: Math.max(0, (r - 1) * EARTH_RADIUS_KM), speed: Math.hypot(vx, vy) * SPEED_UNIT_KMS });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const period =
    prediction.outcome === 'escape' || prediction.outcome === 'crash'
      ? 'none'
      : prediction.periodMin < 120
        ? `${Math.round(prediction.periodMin)} min`
        : `${(prediction.periodMin / 60).toFixed(1)} h`;

  const caption: { title: string; body: string } =
    phase === 'pad'
      ? { title: 'Ready on the pad', body: 'Choose the speed your rocket will have when its engines cut off, then launch.' }
      : phase === 'liftoff'
        ? { title: 'Lift-off', body: 'Real footage: NASA\u2019s Artemis I rocket leaving the pad in November 2022, sped up.' }
        : phase === 'climb'
          ? { title: 'The ground falls away', body: 'Real footage from a camera on the Orion spacecraft as Artemis II climbs, April 2026, sped up.' }
          : words;

  const layer = (visible: boolean) =>
    `absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`;
  const inOrbit = phase === 'orbit';

  const Frame = bare ? 'div' : 'figure';
  const Caption = bare ? 'p' : 'figcaption';
  return (
    <Frame className={bare ? '' : 'night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:p-6'}>
      <Caption className="font-fraunces text-xl font-semibold text-white">Launch a rocket and see where it ends up</Caption>

      <div className="relative mt-3 overflow-hidden rounded-2xl bg-black ring-1 ring-white/10" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas
          ref={canvasRef}
          className={layer(inOrbit)}
          role="img"
          aria-hidden={!inOrbit}
          aria-label={`A satellite released sideways at ${speed.toFixed(1)} kilometres per second. Result: ${words.title}.`}
        />
        <video
          ref={liftoffRef}
          className={layer(phase === 'pad' || phase === 'liftoff')}
          poster="/launch/liftoff-poster.jpg"
          muted
          playsInline
          preload="none"
          onEnded={() => phaseRef.current === 'liftoff' && startClimb()}
          aria-label="A rocket on its launch pad at night"
        >
          <source src="/launch/liftoff.mp4" type="video/mp4" />
          <source src="/launch/liftoff.webm" type="video/webm" />
        </video>
        <video
          ref={climbRef}
          className={layer(phase === 'climb')}
          muted
          playsInline
          preload="none"
          onEnded={() => phaseRef.current === 'climb' && enterOrbit()}
          aria-label="Looking down from the spacecraft as the launch site shrinks below"
        >
          <source src="/launch/climb.mp4" type="video/mp4" />
          <source src="/launch/climb.webm" type="video/webm" />
        </video>

        {phase === 'pad' && (
          <button
            type="button"
            onClick={launchRocket}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-[#f6c453] px-9 py-3.5 text-xl font-semibold text-[#0b1026] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:bg-[#ffd876] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Launch
          </button>
        )}
        {(phase === 'liftoff' || phase === 'climb') && (
          <button
            type="button"
            onClick={enterOrbit}
            className="absolute right-3 top-3 rounded-full bg-black/60 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f6c453]"
          >
            Skip to orbit
          </button>
        )}
        {!inOrbit && <span className="absolute bottom-2 left-3 text-xs text-white/70">Footage: NASA</span>}
      </div>

      <div className="mt-4 min-h-[5.5rem]" aria-live="polite">
        <p className="font-fraunces text-2xl font-semibold text-[#f6c453]">{caption.title}</p>
        <p className="mt-1 leading-relaxed text-slate-200">{caption.body}</p>
      </div>

      <label className="mt-3 block text-sm text-slate-200">
        <span className="flex justify-between">
          <span>Speed at engine cut-off</span>
          <span className="font-semibold text-white">{speed.toFixed(1)} km/s</span>
        </span>
        <input
          type="range"
          min={5}
          max={10.5}
          step={0.1}
          value={speed}
          onChange={(e) => choose(Number(e.target.value))}
          className="mt-2 w-full cursor-pointer accent-[#f6c453]"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Try a speed">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => choose(p.speed)}
            aria-pressed={Math.abs(speed - p.speed) < 0.05}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c453] ${
              Math.abs(speed - p.speed) < 0.05
                ? 'border-[#f6c453] bg-[#f6c453] text-[#0b1026]'
                : 'border-white/20 bg-white/[0.05] text-slate-100 hover:border-white/45'
            }`}
          >
            {p.label}
          </button>
        ))}
        {inOrbit && (
          <button
            type="button"
            onClick={backToPad}
            className="ml-auto rounded-full border border-white/30 px-3.5 py-1.5 text-sm font-semibold text-white hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c453]"
          >
            Launch again
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Readout label="Height now" value={inOrbit ? km(live.altitude) : '\u2013'} />
        <Readout label="Speed now" value={inOrbit ? `${live.speed.toFixed(1)} km/s` : '\u2013'} />
        <Readout label="One orbit takes" value={inOrbit ? period : '\u2013'} />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        The launch footage is real and comes from NASA. What follows it is a simulation using real Earth gravity: a
        satellite released 2,000 km up at the speed you chose, where circular speed is {CIRCULAR_KMS.toFixed(1)} km/s
        and escape speed is {ESCAPE_KMS.toFixed(1)} km/s. It runs at least {SPEED_UP.toLocaleString('en-GB')} times
        faster than real life. Stella Academy is not affiliated with NASA.
      </p>
    </Frame>
  );
}
