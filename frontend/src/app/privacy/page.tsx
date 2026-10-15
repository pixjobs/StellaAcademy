import CookieChoice from '@/components/CookieChoice';
import { SkyTitle } from '@/components/Sky';
import { REPORT_RETENTION_DAYS } from '@/lib/report';
import { VOLUNTEER_RETENTION_MONTHS } from '@/lib/volunteer';
import { CONTROLLER_NAME, PRIVACY_EMAIL, PRIVACY_UPDATED } from '@/lib/site';

// Keep in step with docs/privacy/processing.md.

const linkClass = 'font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]';

function Block({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-[var(--rule)] pt-8">
      <h2 className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[1.0625rem] leading-[1.7] text-[var(--ink)]">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const email = (
    <a href={`mailto:${PRIVACY_EMAIL}`} className={linkClass}>
      {PRIVACY_EMAIL}
    </a>
  );

  return (
    <>
      <SkyTitle title="Privacy">
        What we collect, why, and for how long. The short version comes first, for everyone.
      </SkyTitle>

      <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6">
        <div className="rounded-3xl border border-[var(--rule)] bg-[var(--sheet)] p-6 sm:p-9">
          <div className="space-y-10">
            <section aria-labelledby="short-title">
              <h2 id="short-title" className="font-fraunces text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                The short version
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-[1.0625rem] leading-[1.7] text-[var(--ink)]">
                <li>You do not need to tell us who you are to use Stella Academy.</li>
                <li>Your progress, notes and settings stay on your own device. We never see them.</li>
                <li>
                  If you press <strong>Accept</strong> on the cookie message, Google Analytics counts which pages are
                  visited, so we can see which lessons help. If you press <strong>Decline</strong>, or do not choose,
                  Google Analytics is not used at all. You can change your mind at any time.
                </li>
                <li>
                  If you report a problem with a lesson, please do not include your name or anything about yourself.
                  We use reports only to fix mistakes, and delete them after {REPORT_RETENTION_DAYS} days.
                </li>
                <li>
                  If an adult offers to help test Stella, we keep their name and email only to contact them about
                  testing, and delete them after {VOLUNTEER_RETENTION_MONTHS} months.
                </li>
                <li>We do not show adverts and we do not sell anyone&rsquo;s information.</li>
              </ul>
            </section>

            <Block title="Who we are">
              <p>
                Stella Academy is run by {CONTROLLER_NAME}, who decides how the information on this page is used (the
                &ldquo;data controller&rdquo;). For anything about your information, email {email}.
              </p>
            </Block>

            <Block title="When you visit">
              <p>
                Like any website, our hosting, Google Cloud, records each request: your device&rsquo;s internet (IP)
                address, your browser type, the page and the time. We use this to keep the site running and secure, and
                it is deleted after 30 days.
              </p>
              <p>
                When you search the gallery, send a problem report or offer to help test, your IP address is also held
                in our server&rsquo;s memory for up to an hour to stop anyone sending too many requests. It is never
                written down.
              </p>
            </Block>

            <Block id="analytics" title="Google Analytics">
              <p>
                If you accept cookies, Google Analytics sets cookies and records the pages you view and things you do
                in a lesson, such as opening an answer, with your type of device and approximate location (such
                as your town or city). We use it only to learn which lessons are useful.
              </p>
              <p>
                Until you choose, or if you decline, Google Analytics is not loaded at all and nothing is sent to
                Google. If you accept and later change your mind, its cookies are deleted. We have turned off
                Google&rsquo;s advertising features and its &ldquo;signals&rdquo; that link activity across devices, and
                Google says Google Analytics does not store IP addresses.
              </p>
              <p>Analytics data is kept for no more than 14 months.</p>
              <CookieChoice />
            </Block>

            <Block id="reports" title="Problem reports">
              <p>
                If you use &ldquo;Report a problem&rdquo; on a lesson, we keep the lesson, the kind of problem and what
                you wrote, with any email address or phone number removed automatically. Reports are stored in Europe
                and deleted after {REPORT_RETENTION_DAYS} days. We do not record who sent a report, and we use reports
                only to correct lessons.
              </p>
            </Block>

            <Block id="helpers" title="If you offer to help test Stella">
              <p>
                The form on our Help page is for adults only. We keep what you enter (your name, email address, role,
                subject and any note) in Google Cloud&rsquo;s Firestore database in Europe. Once a week the new names,
                email addresses and notes are copied into our project tracker, Atlassian&rsquo;s Jira, so we can follow
                up. We use them only to contact you about testing, never for marketing, and never share them.
              </p>
              <p>
                Sign-ups are deleted from Firestore {VOLUNTEER_RETENTION_MONTHS} months after they arrive, and the Jira
                copy is deleted at the same time. To be removed sooner, or to see what we hold, email {email}.
              </p>
            </Block>

            <Block title="Gallery searches and NASA pictures">
              <p>
                The words you type in the gallery search are sent to NASA&rsquo;s image library to find pictures. We do
                not keep them or send them to Google Analytics. Pictures in the gallery load directly from NASA&rsquo;s
                servers, which, like any website, receive your IP address.
              </p>
            </Block>

            <Block title="What stays on your device">
              <p>
                Your cookie choice, your journey progress, your quiz scores and the questions saved for you to review,
                your notes and your display settings are saved in your browser so the site remembers them. They are never sent to us. Clearing this site&rsquo;s data in your
                browser removes them.
              </p>
            </Block>

            <Block title="Our reasons">
              <p>
                Running and securing the site, problem reports and limiting abuse: our legitimate interest in providing
                accurate, safe lessons. Analytics cookies and offers to help test: your consent, which you can withdraw at any
                time.
              </p>
            </Block>

            <Block title="Who else is involved">
              <p>
                Google provides our hosting, logging and analytics, and acts on our instructions under its data
                protection terms. Atlassian provides our project tracker (Jira), which holds the details of people who offer to
                help test. Google and Atlassian may process some information outside the UK. If you press &ldquo;Support
                Stella&rdquo;, you leave this site for Ko-fi, and Ko-fi&rsquo;s own privacy policy applies there.
              </p>
            </Block>

            <Block title="Your rights">
              <p>
                You can ask to see, correct or delete information about you, object to how we use it, or withdraw your
                consent. Apart from offers to help test, we do not collect names or accounts, so we usually cannot tell which
                other information is yours, but email {email} and we will help where we can.
              </p>
              <p>
                You can also complain to the Information Commissioner&rsquo;s Office at{' '}
                <a href="https://ico.org.uk/make-a-complaint/" className={linkClass} target="_blank" rel="noopener noreferrer">
                  ico.org.uk
                </a>
                .
              </p>
            </Block>

            <Block title="Children">
              <p>
                Stella Academy is designed for ages 9 and up. We collect as little as we can, show no adverts and do
                not build profiles of anyone. If we ever add accounts, children under 13 will need a parent or carer to
                set them up, and this page will change first.
              </p>
            </Block>

            <p className="border-t border-[var(--rule)] pt-6 text-[15px] text-[var(--ink-soft)]">
              Last updated {PRIVACY_UPDATED}.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
