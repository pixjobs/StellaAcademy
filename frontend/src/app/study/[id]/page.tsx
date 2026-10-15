import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import LessonDiagram from '@/components/LessonDiagram';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { LessonCard } from '@/components/paper/LevelCards';
import { Rich, Tex } from '@/components/paper/maths';
import { SkyBand } from '@/components/Sky';
import LessonIntro from '@/components/study/LessonIntro';
import LessonModel from '@/components/study/LessonModel';
import { hasQuiz } from '@/lib/quiz';
import ReportProblem from '@/components/study/ReportProblem';
import TrackedDetails from '@/components/study/TrackedDetails';
import SupportLink from '@/components/SupportLink';
import { MarkDone } from '@/components/journey/MissionSteps';
import { summaryOf } from '@/lib/lessons';
import { INTROS } from '@/lib/intros';
import { placeOf, stepAfter } from '@/lib/missions';
import { CURRICULUM, CURRICULUM_CHECKED, CURRICULUM_SOURCES } from '@/lib/curriculum';
import { levelAges, levelLabel, searchLabel, subjectOf, SUBJECT_LABEL } from '@/lib/levels';
import { PAPER_SUBJECT } from '@/lib/paper';
import { SITE_NAME, SITE_URL, supportEnabled } from '@/lib/site';
import { studyModules, type ConceptId } from '@/lib/study-modules';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return studyModules.map((m) => ({ id: m.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const mod = studyModules.find((m) => m.id === id);
  if (!mod) return {};
  // The topic and level people search for come first; the site name last.
  const kind = searchLabel(mod.id as ConceptId, mod.category);
  const title = `${mod.title} | ${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
  const description = `${mod.subtitle} Free interactive ${kind}: a model to try, a worked example and practice questions.`;
  // Search results cut titles at about 60 characters, so the site name goes on only where there is room.
  const withSite = `${title} | ${SITE_NAME}`;
  const image = { url: '/opengraph-image.png', width: 1200, height: 630, alt: SITE_NAME };
  return {
    title: { absolute: withSite.length <= 62 ? withSite : title },
    description,
    alternates: { canonical: `/study/${mod.id}` },
    openGraph: { title, description, url: `${SITE_URL}/study/${mod.id}`, type: 'article', siteName: SITE_NAME, locale: 'en_GB', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 border-t border-[var(--rule)] pt-9">
      <h2 id={`${id}-title`} className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function LessonPage({ params }: Props) {
  const { id } = await params;
  const lesson = studyModules.find((m) => m.id === id);
  if (!lesson) notFound();

  const subject = PAPER_SUBJECT[lesson.category];
  const level = levelLabel(lesson.id);
  const place = placeOf(lesson.id);
  const after = stepAfter(lesson.id);
  const next = after ? summaryOf(after.lesson) : null;
  const accent = { '--diagram-accent': subject.ink } as CSSProperties;
  const intro = INTROS[lesson.id];
  const curriculum = CURRICULUM[lesson.id];
  const sources = [...new Set(curriculum.statements.map((s) => s.source))];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.subtitle,
    url: `${SITE_URL}/study/${lesson.id}`,
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
    learningResourceType: 'Interactive lesson',
    educationalLevel: level,
    timeRequired: `PT${lesson.estimatedMinutes}M`,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    teaches: lesson.title,
    educationalAlignment: sources.map((key) => ({
      '@type': 'AlignmentObject',
      alignmentType: 'educationalLevel',
      educationalFramework: 'National curriculum and subject content for England (Department for Education)',
      targetName: curriculum.stage,
      targetUrl: CURRICULUM_SOURCES[key].url,
    })),
    about: { '@type': 'Thing', name: SUBJECT_LABEL[subjectOf(lesson.category)] },
    ...(place ? { isPartOf: { '@type': 'Course', name: `${place.mission.title} (Stella's journey)`, url: `${SITE_URL}/journey#${place.mission.id}`, provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }, description: place.mission.goal } } : {}),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Lessons', item: `${SITE_URL}/study` },
      { '@type': 'ListItem', position: 2, name: lesson.title, item: `${SITE_URL}/study/${lesson.id}` },
    ],
  };

  const jump = [
    { href: '#idea', label: 'The idea' },
    { href: '#example', label: 'Worked example' },
    { href: '#practice', label: 'Practice' },
    ...(lesson.textbookContent ? [{ href: '#notes', label: 'Notes' }] : []),
    { href: '#curriculum', label: 'Curriculum' },
  ];

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]).replace(/</g, '\\u003c') }}
      />

      <SkyBand>
        <nav aria-label="Breadcrumb" className="text-[15px] text-slate-300">
          <Link href="/study" className="underline decoration-white/30 decoration-2 underline-offset-4 hover:text-white">
            All lessons
          </Link>
          {place && (
            <>
              <span aria-hidden className="mx-2">/</span>
              <Link href={`/journey#${place.mission.id}`} className="underline decoration-white/30 decoration-2 underline-offset-4 hover:text-white">
                Mission {place.missionNumber}: {place.mission.title}
              </Link>
              <span aria-hidden className="mx-2">/</span>
              <span>
                step {place.step} of {place.mission.lessons.length}
              </span>
            </>
          )}
        </nav>
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="flex min-w-0 items-start gap-6">
            <span
              className="hidden h-28 w-28 shrink-0 place-items-center rounded-3xl sm:grid"
              style={{ backgroundColor: subject.tint, color: '#eef1fb', ...accent }}
            >
              <LessonDiagram id={lesson.id} size={78} />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-[#f6c453]">
                {level} {SUBJECT_LABEL[subjectOf(lesson.category)].toLowerCase()}, {levelAges(lesson.id)}, about {lesson.estimatedMinutes} minutes
              </p>
              <h1 className="mt-2 font-fraunces text-5xl font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-6xl">
                {lesson.title}
              </h1>
              <p className="mt-3 max-w-2xl text-xl leading-relaxed text-slate-200">{lesson.subtitle}</p>
            </div>
          </div>
          {intro && <LessonIntro id={lesson.id} intro={intro} />}
        </div>
      </SkyBand>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          {/* The model: a night window that stays in view while you read. min-w-0 so a wide model cannot widen the page. */}
          <div className="min-w-0">
            <div id="try-it" className="scroll-mt-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:rounded-3xl">
              <LessonModel id={lesson.id} />
            </div>
          </div>

          {/* The lesson: a sheet of paper. */}
          <div className="min-w-0 space-y-10 rounded-3xl border border-[var(--rule)] bg-[var(--sheet)] p-6 text-[1.0625rem] leading-[1.7] sm:p-9">
            <section id="idea" aria-labelledby="idea-title" className="scroll-mt-6">
              <nav aria-label="On this page" className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
                {jump.map((j) => (
                  <a key={j.href} href={j.href} className="font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]">
                    {j.label}
                  </a>
                ))}
              </nav>
              <h2 id="idea-title" className="mt-6 font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                The idea
              </h2>
              <div className="mt-5 overflow-x-auto rounded-2xl px-6 py-6 text-center text-2xl sm:text-3xl" style={{ backgroundColor: subject.tint }}>
                <Tex tex={lesson.formula} block />
              </div>

              <dl className="mt-5 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                {lesson.variables.map((v) => (
                  <div key={v.symbol} className="grid grid-cols-[auto_1fr] gap-x-4 py-3.5">
                    <dt className="row-span-2 grid h-11 min-w-11 place-items-center rounded-xl px-2 text-xl" style={{ backgroundColor: subject.tint }}>
                      <Tex tex={v.symbol} />
                    </dt>
                    <dd className="font-semibold text-[var(--ink)]">
                      {v.name}
                      {v.unit && <span className="font-normal text-[var(--ink-soft)]">, <Rich text={v.unit} /></span>}
                    </dd>
                    <dd className="text-[15px] leading-relaxed text-[var(--ink-soft)]"><Rich text={v.description} /></dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 space-y-7">
                {lesson.conceptSteps.map((step) => (
                  <div key={step.stepNumber}>
                    <h3 className="font-fraunces text-xl font-semibold text-[var(--ink)]">{step.title}</h3>
                    <p className="mt-2 text-[var(--ink)]">
                      <Rich text={step.content} />
                    </p>
                    <p className="mt-3 rounded-r-xl border-l-4 py-3 pl-4 pr-4" style={{ borderColor: subject.ink, backgroundColor: subject.tint }}>
                      <strong style={{ color: subject.ink }}>Key point:</strong> <Rich text={step.keyInsight} />
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-7 text-[var(--ink)]">
                <strong>Where you&rsquo;ll see this:</strong> <Rich text={lesson.realWorldConnection} />
              </p>
            </section>

            <Section id="example" title="Worked example">
              <p className="font-semibold text-[var(--ink)]">
                <Rich text={lesson.solvedExample.problem} />
              </p>
              <ol className="mt-4 space-y-3">
                {lesson.solvedExample.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-[#0b1026]" style={{ backgroundColor: subject.ink }}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <Rich text={step} />
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 overflow-x-auto rounded-2xl border-2 px-5 py-4 text-xl" style={{ borderColor: subject.ink }}>
                <span className="mr-3 text-base font-semibold" style={{ color: subject.ink }}>
                  Answer
                </span>
                <Tex tex={lesson.solvedExample.resultFormula} />
              </p>
            </Section>

            {hasQuiz(lesson.id) ? (
              <Section id="practice" title="Practice">
                <p className="text-[var(--ink-soft)]">
                  Practise with the step-by-step quiz in the Try it panel{lesson.id === 'measures' ? ' (the Quiz tab)' : ''}. Each question is answered one
                  step at a time, with new numbers every time, and the questions you miss come back for review.
                </p>
                <p className="mt-3">
                  <a href="#try-it" className="font-semibold text-[var(--action)] underline underline-offset-2 hover:text-[var(--action-hover)]">
                    Go to the quiz
                  </a>
                </p>
              </Section>
            ) : (
              <Section id="practice" title="Practice questions">
                <p className="text-[var(--ink-soft)]">Have a go first, then open the hint or the answer.</p>
                <ol className="mt-4 space-y-4">
                  {lesson.practiceProblems.map((problem, i) => (
                    <li key={i} className="rounded-2xl border border-[var(--rule)] bg-[var(--paper)] p-5">
                      <p className="text-[var(--ink)]">
                        <span className="mr-2 font-semibold" style={{ color: subject.ink }}>
                          {i + 1}.
                        </span>
                        <Rich text={problem.question} />
                      </p>
                      <div className="mt-3 space-y-2 text-[15px]">
                        <details>
                          <summary className="cursor-pointer font-semibold text-[var(--action)] hover:text-[var(--action-hover)]">Show a hint</summary>
                          <p className="mt-2 text-[var(--ink-soft)]">
                            <Rich text={problem.hint} />
                          </p>
                        </details>
                        <TrackedDetails summary="Show the answer" event="practice_answer_revealed" params={{ lesson: lesson.id, question: i + 1 }}>
                          <p className="mt-2 font-semibold text-[var(--ink)]">
                            <Rich text={problem.answer} />
                          </p>
                        </TrackedDetails>
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {lesson.textbookContent && (
              <Section id="notes" title="Notes">
                <MarkdownRenderer>{lesson.textbookContent}</MarkdownRenderer>
              </Section>
            )}

            <Section id="curriculum" title="Where this fits in the curriculum">
              <p className="text-lg text-[var(--ink)]">
                <strong>{curriculum.stage}</strong> in the curriculum for England.
              </p>
              <p className="mt-2 text-[var(--ink-soft)]">The Department for Education says pupils should be taught to:</p>
              <ul className="mt-4 space-y-3">
                {curriculum.statements.map((statement, i) => (
                  <li key={i} className="rounded-2xl border border-[var(--rule)] bg-[var(--paper)] p-4">
                    <p className="text-sm font-semibold" style={{ color: subject.ink }}>{statement.where}</p>
                    <blockquote className="mt-1 text-[var(--ink)]">&ldquo;{statement.text}&rdquo;</blockquote>
                  </li>
                ))}
              </ul>
              {curriculum.note && <p className="mt-4 leading-relaxed text-[var(--ink)]">{curriculum.note}</p>}
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                Quoted from{' '}
                {sources.map((key, i) => (
                  <span key={key}>
                    {i > 0 && (i === sources.length - 1 ? ' and ' : ', ')}
                    <a
                      href={CURRICULUM_SOURCES[key].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]"
                    >
                      {CURRICULUM_SOURCES[key].title}
                    </a>
                  </span>
                ))}{' '}
                (Department for Education, gov.uk), checked on {CURRICULUM_CHECKED}. This is the content every exam
                board has to cover. It is not one board&rsquo;s specification, so use your own for exactly what is
                examined.
              </p>
            </Section>
          </div>
        </div>

        <div className="mt-14 border-t border-[var(--rule)] pt-10">
          <MarkDone lesson={lesson.id} />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <section aria-labelledby="next-title">
            <h2 id="next-title" className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
              {!next ? 'You have reached the end of the journey' : after?.newMission ? `Next mission: ${after.newMission.title}` : 'Next on this mission'}
            </h2>
            {next ? (
              <div className="mt-6 max-w-sm">
                <LessonCard lesson={next} />
              </div>
            ) : (
              <p className="mt-4 text-lg text-[var(--ink-soft)]">
                That was the last lesson of the last mission.{' '}
                <Link href="/journey" className="font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]">
                  Look back over the whole journey
                </Link>
                .
              </p>
            )}
          </section>
          <div className="space-y-6 self-end">
            {supportEnabled && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--rule)] bg-[var(--sheet)] p-5">
                <p className="max-w-md leading-relaxed text-[var(--ink)]">
                  These lessons are free to use. If this one helped, you can chip in towards hosting and new topics.
                </p>
                <SupportLink placement="lesson_end" />
              </div>
            )}
            <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
              This lesson was written with AI assistance. Check formulas and figures against your textbook or exam
              board&rsquo;s specification before relying on them in assessed work.
            </p>
            <ReportProblem lesson={lesson.id} />
          </div>
        </div>
      </div>
    </article>
  );
}
