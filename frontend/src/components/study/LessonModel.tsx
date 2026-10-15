'use client';

import { useState, type ReactNode } from 'react';
import GSAPSimulation from '@/components/GSAPSimulation';
import CircuitBoard from '@/components/lesson-models/CircuitBoard';
import GasPiston from '@/components/lesson-models/GasPiston';
import GearTrain from '@/components/lesson-models/GearTrain';
import MeasuresModel from '@/components/lesson-models/MeasuresModel';
import MomentumTrack from '@/components/lesson-models/MomentumTrack';
import TransferOrbit from '@/components/lesson-models/TransferOrbit';
import TrigTriangle from '@/components/lesson-models/TrigTriangle';
import OrbitLauncher from '@/components/paper/OrbitLauncher';
import WaveInstrument from '@/components/paper/WaveInstrument';
import UnitConverter from '@/components/study/UnitConverter';
import { hasQuiz, QUIZZES } from '@/lib/quiz';
import { useQuizActive } from '@/lib/quiz/active';
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

  const controls: Partial<Record<ConceptId, ReactNode>> = {
    prism: <Slider label="Refractive index" display={`n = ${refractiveIndex.toFixed(2)}`} min={1} max={2.5} step={0.1} value={refractiveIndex} onChange={setRefractiveIndex} />,
  };

  return (
    <Panel>
      <div className="mt-3 h-[360px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 lg:h-[400px]">
        <GSAPSimulation conceptId={id} refractiveIndex={refractiveIndex} />
      </div>
      {controls[id] && <div className="mt-4">{controls[id]}</div>}
    </Panel>
  );
}

/**
 * While a quiz question on this lesson is in progress, the model is hidden (kept mounted, so nothing is
 * lost) and a note says why, so the model cannot be used to work out the answer.
 */
function PausedDuringQuiz({ id, children }: { id: ConceptId; children: ReactNode }) {
  const paused = useQuizActive((s) => !!s.active[id]);
  return (
    <>
      {paused && (
        <figure className="night-window overflow-hidden rounded-3xl p-4 ring-1 ring-white/10 sm:p-6">
          <figcaption className="font-fraunces text-xl font-semibold text-white">Try it</figcaption>
          <p className="mt-3 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-300/30" role="status">
            Paused while you answer a quiz question. It comes back when you finish the question.
          </p>
        </figure>
      )}
      <div hidden={paused}>{children}</div>
    </>
  );
}

/** Lessons whose "Try it" panel is the old fixed-question flashcards (in GSAPSimulation). */
const FLASHCARDS: ConceptId[] = ['arithmetic', 'basic-geometry', 'proportions', 'decimals-percentages', 'binary', 'multiplication', 'fraction-ops', 'negative-numbers', 'exponents-roots'];

/**
 * On a lesson with a step-by-step quiz, the old flashcards would only repeat it, and they sit at the top
 * of the page while the quiz is further down. This card takes their place and leads to the quiz.
 */
function QuizPointer({ id }: { id: ConceptId }) {
  const quiz = QUIZZES[id]!;
  return (
    <Panel>
      <p className="mt-3 text-slate-200">Practise with the step-by-step quiz. Each question is answered one step at a time, with new numbers every time.</p>
      <ul className="mt-4 space-y-2">
        {Object.values(quiz.rounds).map((r) => (
          <li key={r.label} className="rounded-xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
            <span className="block font-semibold text-white">{r.label}</span>
            <span className="block text-sm text-slate-300">{r.blurb}</span>
          </li>
        ))}
      </ul>
      <a
        href="#practice"
        className="mt-4 inline-block rounded-lg bg-[#f6c453] px-4 py-2.5 text-sm font-bold text-[#0b1026] hover:bg-[#f8d27a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Start the quiz
      </a>
    </Panel>
  );
}

/** Each lesson's interactive model, in its night window. */
export default function LessonModel({ id }: { id: ConceptId }) {
  if (id === 'measures') return <MeasuresModel />; // pauses its own tools during a quiz question
  if (hasQuiz(id) && FLASHCARDS.includes(id)) return <QuizPointer id={id} />;
  return (
    <PausedDuringQuiz id={id}>
      <ModelFor id={id} />
    </PausedDuringQuiz>
  );
}

function ModelFor({ id }: { id: ConceptId }) {
  if (id === 'gravity') return <OrbitLauncher placement="lesson" />;
  if (id === 'waves') return <WaveInstrument placement="lesson" />;
  if (id === 'circuit') return <CircuitBoard />;
  if (id === 'trigonometry') return <TrigTriangle />;
  if (id === 'gears') return <GearTrain />;
  if (id === 'momentum') return <MomentumTrack />;
  if (id === 'thermodynamics') return <GasPiston />;
  if (id === 'trajectory') return <TransferOrbit />;
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
