import Link from 'next/link';
import { SkyTitle } from '@/components/Sky';
import SupportLink from '@/components/SupportLink';
import { lessonSummaries } from '@/lib/lessons';
import { LEVELS } from '@/lib/levels';
import { supportEnabled } from '@/lib/site';

const linkClass = 'font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]';

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--rule)] pt-8">
      <h2 className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[1.0625rem] leading-[1.7] text-[var(--ink)]">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <SkyTitle title="About Stella Academy">
        {lessonSummaries.length} free interactive physics and maths lessons, built on one idea: you understand a
        formula faster when you can change a number and watch what happens.
      </SkyTitle>

      <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6">
        <div className="rounded-3xl border border-[var(--rule)] bg-[var(--sheet)] p-6 sm:p-9">
          <div className="space-y-10">
            <section>
              <h2 className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">Who it is for</h2>
              <div className="mt-3 space-y-3 text-[1.0625rem] leading-[1.7] text-[var(--ink)]">
                <p>
                  Anyone curious about how the universe works, from about age 9 upwards. Stella is the Latin word for
                  star, and the lessons lean on space wherever they can: orbits, rockets, light from distant stars.
                </p>
                <ul className="space-y-1.5">
                  {LEVELS.map((level) => (
                    <li key={level.id}>
                      <strong>{level.label}</strong>, {level.ages}. {level.blurb}
                    </li>
                  ))}
                </ul>
                <p>
                  The ages are the usual ones for each stage, not a rule. Every lesson is matched to the Department
                  for Education&rsquo;s national curriculum or its GCSE and A-level subject content, and quotes the
                  statements it covers. That is the content every exam board must include; it is not one
                  board&rsquo;s specification, so your own remains the authority on what you need to know.
                </p>
              </div>
            </section>

            <Block title="What is in a lesson">
              <p>
                Every lesson has something to interact with (a model with controls, an animation, or a set of
                flashcards), an explanation of the key formula with each symbol defined, one worked example, practice
                questions with hints and answers, and longer notes for reference.
              </p>
              <p>
                <Link href="/study" className={linkClass}>
                  Browse all lessons
                </Link>
              </p>
            </Block>

            <Block title="How the lessons are made">
              <p>
                Lesson text and the visual models are written with AI assistance. They are meant to help you build
                understanding, not to replace your course materials. Check formulas and figures against your textbook
                or exam board&rsquo;s specification before relying on them in assessed work.
              </p>
            </Block>

            <Block title="Space pictures">
              <p>
                The{' '}
                <Link href="/gallery" className={linkClass}>
                  gallery
                </Link>{' '}
                draws on NASA&rsquo;s Astronomy Picture of the Day and the NASA Image and Video Library. Each image
                links back to its NASA source.
              </p>
              <p>
                The launch footage on the home page and in the gravity lesson is also NASA&rsquo;s: the lift-off of
                Artemis I in November 2022 (NASA/Frank Michaux), and the view from the Orion spacecraft as Artemis II
                climbed in April 2026. Six lessons also open with NASA footage, such as a Space Shuttle’s boosters
                separating and a rover driving on Mars. All of it is trimmed, and most is sped up. Stella Academy is
                not affiliated with NASA.
              </p>
            </Block>

            <Block title="Reading comfort">
              <p>
                Use Display in the menu to change the text size and typeface, or to turn off motion and transparency.
                Your choices are saved in this browser only.
              </p>
            </Block>

            <Block title="Cost and privacy">
              <p>
                The lessons are free to use. We use Google Analytics to see which lessons are useful, and it only sets
                cookies if you accept them in the banner.{' '}
                <Link href="/privacy" className={linkClass}>
                  Read the privacy policy
                </Link>
                .
              </p>
              {supportEnabled && (
                <>
                  <p>If the lessons help you, you can chip in towards hosting and new topics.</p>
                  <p>
                    <SupportLink placement="about" />
                  </p>
                </>
              )}
            </Block>
          </div>
        </div>
      </div>
    </>
  );
}
