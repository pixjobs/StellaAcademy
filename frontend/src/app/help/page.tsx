import HelpForm from '@/components/HelpForm';
import { SkyTitle } from '@/components/Sky';

export default function HelpPage() {
  return (
    <>
      <SkyTitle title="Help test Stella">
        We&rsquo;re looking for teachers, scientists and parents to try the lessons and tell us what&rsquo;s wrong or
        missing.
      </SkyTitle>

      <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6">
        <div className="rounded-3xl border border-[var(--rule)] bg-[var(--sheet)] p-6 sm:p-9">
          <section>
            <h2 className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">What helping looks like</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-[1.0625rem] leading-[1.7] text-[var(--ink)]">
              <li>Work through one mission of five or six short lessons, on your own or with a class.</li>
              <li>Tell us what&rsquo;s wrong, what&rsquo;s confusing and what&rsquo;s missing. A few short questions guide it.</li>
              <li>It takes an hour or two, online, whenever suits you. There&rsquo;s no cost and no commitment.</li>
              <li>If you&rsquo;d like, you&rsquo;re credited by name on the lessons you help with.</li>
            </ul>
            <p className="mt-3 text-[1.0625rem] leading-[1.7] text-[var(--ink)]">
              Pupils never need to sign up or give any details. The lessons simply open in a browser.
            </p>
          </section>

          <section className="mt-10 border-t border-[var(--rule)] pt-8">
            <h2 className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">Register your interest</h2>
            <p className="mt-3 mb-5 text-[1.0625rem] leading-[1.7] text-[var(--ink)]">
              Leave your details and we&rsquo;ll get in touch when the next round of testing starts. This form is for
              adults only.
            </p>
            <HelpForm />
          </section>
        </div>
      </div>
    </>
  );
}
