import Link from 'next/link';
import JourneyPath from '@/components/journey/JourneyPath';
import LevelCards from '@/components/paper/LevelCards';
import OrbitLauncher from '@/components/paper/OrbitLauncher';
import Starfield, { Horizon } from '@/components/Sky';
import SupportLink from '@/components/SupportLink';
import { getApod } from '@/lib/apod';
import { lessonSummaries } from '@/lib/lessons';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, supportEnabled } from '@/lib/site';

const STEPS = [
  { title: 'Play with the model', body: 'Move a slider and see what changes. You get a feel for the idea before any equations.' },
  { title: 'Follow a worked example', body: 'One question solved a line at a time, with every symbol in the formula explained.' },
  { title: 'Answer the practice questions', body: 'Try them yourself, then reveal a hint or the answer to check your working.' },
];

export default async function HomePage() {
  const apod = await getApod();
  // getApod falls back to a local image when NASA has no real picture; only name the picture when it is real.
  const apodTitle = apod && apod.bgUrl !== '/bg.jpg' ? apod.title : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en-GB',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* The sky first: Stella is about where this physics and maths can take you. */}
      <section className="theme-night relative overflow-hidden bg-[linear-gradient(180deg,#05081a_0%,#0b1026_55%,#1a2060_100%)] pb-28 sm:pb-36">
        <Starfield />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_1.02fr] lg:gap-14 lg:pt-12">
          <div>
            <h1 className="font-fraunces text-5xl font-semibold leading-[1.02] tracking-[-0.025em] text-white sm:text-6xl lg:text-[4.1rem]">
              Physics and maths that take you to the stars
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-slate-200">
              Free interactive lessons for ages 9 and up, from first fractions to A&#8209;level physics. Launch a
              satellite, bend a beam of light, tune a wave: every idea here is something you can try for yourself.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="#journey"
                className="inline-flex items-center justify-center rounded-full bg-[#f6c453] px-7 py-3.5 text-lg font-semibold text-[#0b1026] hover:bg-[#ffd876] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c453]"
              >
                Start the journey
              </Link>
              <Link href="#lessons" className="text-lg font-semibold text-white underline decoration-white/40 decoration-2 underline-offset-[6px] hover:decoration-white">
                Browse the lessons
              </Link>
            </div>
          </div>

          <OrbitLauncher placement="home_hero" />
        </div>

        <div id="journey" className="relative mx-auto mt-16 max-w-6xl scroll-mt-6 px-4 sm:px-6">
          <h2 className="font-fraunces text-4xl font-semibold tracking-[-0.02em] text-white">Stella&rsquo;s journey</h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Five missions take you from your first number skills to reading the light of distant stars. Each one is a
            short run of lessons, and the star marks where you are.
          </p>
          <div className="mt-8">
            <JourneyPath />
          </div>
        </div>
        <Horizon />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section id="lessons" aria-labelledby="lessons-title" className="scroll-mt-6 pb-14 pt-8">
          <h2 id="lessons-title" className="font-fraunces text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Or pick by level
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--ink-soft)]">
            Pick the level that suits you, whatever your age. The levels are our guide to difficulty and are not
            matched to one exam board, so check your own specification if you are revising for an exam.
          </p>
          <div className="mt-8">
            <LevelCards lessons={lessonSummaries} />
          </div>
          <p className="mt-8">
            <Link href="/study" className="text-lg font-semibold text-[var(--action)] underline decoration-2 underline-offset-[6px] hover:text-[var(--action-hover)]">
              See all {lessonSummaries.length} lessons in one list
            </Link>
          </p>
        </section>

        <section aria-labelledby="how-title" className="border-t border-[var(--rule)] py-14">
          <h2 id="how-title" className="font-fraunces text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            How a lesson works
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-[var(--rule)] bg-[var(--sheet)] p-6">
                <span className="font-fraunces text-5xl font-semibold leading-none text-[var(--action)]" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-4 font-fraunces text-xl font-semibold text-[var(--ink)]">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--ink-soft)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="free-title" className="border-t border-[var(--rule)] py-14">
          <div className="max-w-2xl">
            <h2 id="free-title" className="font-fraunces text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Free lessons
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-[var(--ink-soft)]">
              All {lessonSummaries.length} lessons on Stella Academy are free to use.
              {supportEnabled && ' If the lessons help you, you can chip in towards hosting and new topics.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <SupportLink placement="home" />
              <Link href="/about" className="font-semibold text-[var(--action)] underline decoration-2 underline-offset-[6px] hover:text-[var(--action-hover)]">
                How the lessons are made
              </Link>
            </div>
          </div>
          <p className="mt-10 text-[var(--ink-soft)]">
            Need a break?{' '}
            <Link href="/gallery" className="font-semibold text-[var(--ink)] underline decoration-[var(--rule)] decoration-2 underline-offset-4 hover:decoration-[var(--ink)]">
              {apodTitle ? `See today's NASA picture, "${apodTitle}"` : 'Look through the NASA image gallery'}
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
