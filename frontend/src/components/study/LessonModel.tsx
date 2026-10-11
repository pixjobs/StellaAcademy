'use client';

import { useState, type ReactNode } from 'react';
import GSAPSimulation from '@/components/GSAPSimulation';
import OrbitLauncher from '@/components/paper/OrbitLauncher';
import WaveInstrument from '@/components/paper/WaveInstrument';
import UnitConverter from '@/components/study/UnitConverter';
import type { ConceptId } from '@/lib/study-modules';

function Slider({
  label,
  display,
  onChange,
  ...input
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm text-slate-200">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="font-semibold text-white">{display}</span>
      </span>
      <input type="range" {...input} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full cursor-pointer accent-[#f6c453]" />
    </label>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <figure className="night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_70px_-20px_rgba(11,16,38,0.6)] ring-1 ring-white/10 sm:p-6">
      <figcaption className="font-fraunces text-xl font-semibold text-white">Try it</figcaption>
      {children}
    </figure>
  );
}

/** The animated models, with a control where the lesson has one to adjust. */
function AnimatedModel({ id }: { id: ConceptId }) {
  const [refractiveIndex, setRefractiveIndex] = useState(1.5);
  const [gearRatio, setGearRatio] = useState(2);
  const [deltaV, setDeltaV] = useState(1);
  const [resistance, setResistance] = useState(150);

  const controls: Partial<Record<ConceptId, ReactNode>> = {
    prism: <Slider label="Refractive index" display={`n = ${refractiveIndex.toFixed(2)}`} min={1} max={2.5} step={0.1} value={refractiveIndex} onChange={setRefractiveIndex} />,
    gears: <Slider label="Gear ratio" display={`${gearRatio}:1`} min={1} max={3} step={1} value={gearRatio} onChange={setGearRatio} />,
    trajectory: <Slider label="Transfer delta-v" display={`${deltaV.toFixed(2)} km/s`} min={1} max={2.5} step={0.1} value={deltaV} onChange={setDeltaV} />,
    circuit: <Slider label="Resistance" display={`${resistance} Ω`} min={50} max={1000} step={50} value={resistance} onChange={setResistance} />,
  };

  return (
    <Panel>
      <div className="mt-3 h-[360px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 lg:h-[400px]">
        <GSAPSimulation conceptId={id} refractiveIndex={refractiveIndex} gearRatio={gearRatio} deltaV={deltaV} resistance={resistance} />
      </div>
      {controls[id] && <div className="mt-4">{controls[id]}</div>}
    </Panel>
  );
}

/** Each lesson's interactive model, in its night window. */
export default function LessonModel({ id }: { id: ConceptId }) {
  if (id === 'gravity') return <OrbitLauncher placement="lesson" />;
  if (id === 'waves') return <WaveInstrument placement="lesson" />;
  if (id === 'units')
    return (
      <Panel>
        <div className="mt-3">
          <UnitConverter />
        </div>
      </Panel>
    );
  return <AnimatedModel id={id} />;
}
