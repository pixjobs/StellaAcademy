import type { Metadata } from 'next';
import JourneyPath from '@/components/journey/JourneyPath';
import { MissionSteps, ResetJourney } from '@/components/journey/MissionSteps';
import { SkyBand } from '@/components/Sky';
import { summaryOf } from '@/lib/lessons';
import { MISSIONS } from '@/lib/missions';

export const metadata: Metadata = {
  title: "Stella's journey: physics and maths in five space missions",
  description:
    'Follow five missions through physics and maths, from first number skills to reading starlight. Each mission is a short run of interactive lessons in order.',
  alternates: { canonical: '/journey' },
};

export default function JourneyPage() {
  const total = MISSIONS.reduce((n, m) => n + m.lessons.length, 0);
  return (
    <>
      <SkyBand stars={150}>
        <h1 className="font-fraunces text-5xl font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-6xl">
          Stella&rsquo;s journey
        </h1>
        <p className="mt-4 max-w-2xl text-xl leading-relaxed text-slate-200">
          Five missions and {total} lessons, from your first number skills to reading the light of distant stars. Follow
          them in order, or jump in wherever suits you.
        </p>
        <div className="mt-10">
          <JourneyPath />
        </div>
      </SkyBand>

      <div className="mx-auto max-w-3xl space-y-14 px-4 sm:px-6">
        {MISSIONS.map((mission, i) => (
          <section key={mission.id} id={mission.id} aria-labelledby={`${mission.id}-title`} className="scroll-mt-6">
            <p className="font-semibold text-[var(--action)]">
              Mission {i + 1} of {MISSIONS.length}
            </p>
            <h2 id={`${mission.id}-title`} className="mt-1 font-fraunces text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
              {mission.title}
            </h2>
            <p className="mt-2 text-lg leading-relaxed text-[var(--ink-soft)]">{mission.goal}</p>
            <div className="mt-6">
              <MissionSteps steps={mission.lessons.map(summaryOf)} />
            </div>
          </section>
        ))}

        <div className="border-t border-[var(--rule)] pt-8 text-[var(--ink-soft)]">
          <p className="leading-relaxed">
            Your progress is saved in this browser on this device. It is not sent anywhere, and it will be lost if you
            clear your browsing data.
          </p>
          <p className="mt-3">
            <ResetJourney />
          </p>
        </div>
      </div>
    </>
  );
}
