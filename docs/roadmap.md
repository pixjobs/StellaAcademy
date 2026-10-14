# Stella Academy: plan to self-sustainability

Written 12 October 2026. Replaces the July 2026 "explorer tool" plan, which described a build that no longer exists.

## Pace

Decided 12 October 2026: there is no immediate need for revenue, and time is on our side. Build only what the last
test called for. The timings below are an order, not a schedule.

## Where we stand out

Stella Academy does not compete as a revision site. Bitesize, Oak, Isaac Physics, Seneca, Save My Exams and Physics &
Maths Tutor already cover the syllabus, mostly free and with teacher-written content.

The position is:

> Learn the physics and maths it takes to get to space.

- **Missions, not levels, come first.** A learner finishes "Get to orbit", not "GCSE mechanics".
- **Depth on one theme.** Thirty excellent space lessons beat three hundred generic ones.
- **We sell motivation and context.** Stella is the reason to care about the syllabus, alongside whatever a school
  uses for exam practice.

What already supports this: five missions (`/journey`), real NASA launch footage, simulators to play with, 29 lessons.

## Who pays

Students do not pay. The buyers are:

1. **Teachers and STEM club leaders**, who pay small amounts for something ready to use. (Assumed to come first:
   packs need no accounts, and a teacher brings a whole class. To be confirmed.)
2. **Parents of 9 to 13 year olds**, including home educators, who pay for enrichment that keeps a child interested.

## Rules for using NASA material

Most NASA photographs and footage are not copyrighted and may be used in paid products as well as free ones, with
credit. These rules still apply and shape everything below. Read NASA's media usage guidelines before the first paid
product goes out, and ask NASA where anything is unclear.

- **We charge for our own work, not for NASA's.** Paid features are progress, marking, certificates, tutoring and
  teaching materials. NASA footage stays in the free lessons.
- **The gallery stays free.** It shows whatever NASA's search returns, including people and third-party pictures.
- **No suggestion of endorsement.** "Stella Academy is not part of NASA and is not endorsed by it" goes on the site
  and on every paid product.
- **No NASA logo** on anything sold or used to promote the site.
- **No recognisable people** in paid products without permission.
- **Check the credit on every picture.** Material credited to ESA, a contractor or a named photographer is not NASA's
  to give away.
- **No NASA imagery in adverts** without going through NASA's approval process.
- Every clip and picture used is recorded with its source in a `CREDITS.md` beside it.

## Revenue, in the order it gets built

| Stream | What it is | When | Needs |
| --- | --- | --- | --- |
| Tips | Ko-fi button, live since 12 October 2026 | Now | Nothing more. Expect it to cover hosting at best. |
| Mission packs | Lesson plan, worksheet and slides per mission, £3 to £8 each, sold through Ko-fi's shop | Months 1 to 3 | Teacher review; per-image check against the rules above |
| Stella Plus | About £4 a month or £35 a year, bought by an adult: progress saved across devices, auto-marked practice, mission certificates | Months 3 to 6 | Login, privacy policy, payment |
| AI tutor "Stella" | Part of Plus, with a usage cap so it cannot cost more than it earns | Months 6 to 12 | Plus running |
| Grant through a host | A project grant applied for by a partner organisation, with Stella named as the delivery partner (see "Seed funding") | Apply in months 3 to 9 | An academic or school partner; evidence of reach |
| School licences | Whole-school access | Months 6 to 12 | Plus running; a legal entity |

Not planned: adverts on the site. Paid search advertising is not planned either while there is nothing to sell;
Google's Ad Grants (free search adverts for non-profits) would suit Stella but need registered charity status. There is no charity, so support is never described as a charitable donation and Gift Aid is
never mentioned.

## Seed funding comes before any company

Decided 12 October 2026: no company or other legal entity is set up until there is money to justify it. Until then
Stella Academy is run by its owner as an individual.

Money that can come in without an entity:

- **Tips and pack sales**, received personally. In the UK the first £1,000 a year of this kind of income is normally
  covered by the trading allowance; check the owner's own tax position.
- **A grant held by a host.** A university outreach team, school trust or existing charity applies and holds the
  money; Stella is named in the bid and paid for delivery. The best fit found so far is the STFC Public Engagement
  Spark Awards (£5,000 to £20,000, 12 to 36 months, astronomy and space science in remit). It requires a UK host with
  accountant-prepared accounts and a subject expert from an STFC-funded area, both of which a university partner
  supplies. The 2026A round closed on 25 August 2026; later rounds are listed on UKRI's site.
- **Prizes and small awards** that pay individuals.

Not realistic for now: Erasmus+ (reopens to the UK for 2027 but needs partners in several countries and an entity)
and Horizon Europe (research consortia). The UK Space Agency had no open education call in July 2026; watch it.

**One partner closes three gaps:** a university physicist or outreach officer can review the lessons, act as the
subject expert a funder requires, and host the grant. Finding that person is the most valuable next step.

**Set up a company only when one of these happens:**

1. A grant or customer will pay only an organisation, and the amount covers the set-up and a year of accounts.
2. Income is heading past the £1,000 trading allowance.
3. Accounts go live and children's data is held, where separating the project from its owner personally is prudent.

## What "sustainable" means

- **Stage 1, covers its costs.** Hosting is small; a few subscribers or pack sales a month is enough.
- **Stage 2, pays for the time.** £1,000 a month is roughly 250 Plus subscribers, or fewer with packs and a grant
  alongside. As a rule of thumb 1 to 3 in 100 regular users of a free product pay, which implies 10,000 to 25,000
  regular learners. This is a guess until we have our own figures.

## Phases

Each phase has a test. If the test fails, fix that phase before building the next.

### 1. Credibility (next 4 weeks)

The lessons become co-developed with teachers, and the site says so. No competitor of this size can claim it, and it
answers the "written with AI" doubt directly.

- Recruit a small panel of three to five physics and maths teachers. Each reviews the lessons at their level against
  a short checklist (correct, pitched right, matches how it is taught, what is missing). About 20 minutes a lesson.
- A lesson shows "Reviewed by" with the teacher's name and subject only once it has been reviewed, and only with
  their permission. Unreviewed lessons keep the current AI notice.
- Done 14 October 2026: every lesson has a "Report a problem" form so any teacher can flag an error. It asks for no
  name or email; reports go to Cloud Logging (see DEPLOYMENT.md) and are copied into Jira project KAN.
- What teachers get while there is no budget: a named credit, free packs, a say in what is built next, and a share
  of sales on any pack they co-write. A fee for review time goes into the first grant bid.
- Agree in writing, before anyone contributes, that Stella Academy may use and adapt what they suggest.

- Find an academic or teacher partner (a university outreach team is ideal: reviewer, subject expert and grant host
  in one). They review the lessons, and the site says so. This is the biggest gap against competitors.
- Done 12 October 2026: lesson titles and summaries renamed to what people search for ("Dynamic Systems" became
  "Differential Equations", and so on).
- Done 12 October 2026: every lesson matched to the Department for Education's national curriculum or GCSE and A-level
  subject content, quoting the statements it covers (`frontend/src/lib/curriculum.ts`). The site's levels are now key
  stage 2, key stage 3, GCSE and A-level.
- Rewrite each lesson's notes and practice to the level of those statements, citing official sources
  only. Done 14 October 2026: all 29 lessons. Every lesson's notes now cite only Department for Education documents,
  each has at least six practice questions, and content beyond the cited stage is either removed or marked "going
  further" (for example Snell's law). Next: teacher review, which needs the partner search (parked).
- Done 12 October 2026: new interactive models for circuits, trigonometry, gears, momentum, gases and transfer orbits
  (`frontend/src/components/lesson-models/`). Their labels are small on phones and need a pass.
- Done 14 October 2026: key stage 2 notes and practice rewritten in wording for ages 9 to 11.
- Publish a privacy policy (needs a named owner and a contact email). Drafted 14 October 2026 with a record of
  processing and a DPIA for the report form: `docs/privacy/`, which lists the open actions.
- Done 14 October 2026: a "Help test Stella" page (`/help`, linked from About) where adults register interest in
  testing. Sign-ups are kept in Firestore for 12 months and listed every Monday in a Jira KAN item, so there is no
  inbox to watch (see DEPLOYMENT.md). It stays low-key until the site is ready to promote.
- Outreach routes for reviewers and testers (all parked, nothing sent): university physics and astronomy teams (the
  owner is an Imperial College MBA alumnus, so Imperial's alumni network and Physics department are a warm route;
  Cambridge's Institute of Astronomy is another), space-education bodies, STEM Ambassadors, and independent schools
  such as Littlegarth and Woodbridge as testers, not funders. Shortlist and drafts: `~/stella-work/outreach/`.
- Planned (decided 14 October 2026, not built; Jira KAN-57): **volunteer review**. Volunteers choose which lessons to
  review rather than being assigned one. (1) Signing up on `/help` gives each volunteer a personal review link, shown
  on the thank-you message and in the Monday digest; no accounts or emails. (2) The link opens a review page listing
  lessons by key stage with a status (not yet reviewed, being reviewed, reviewed), with unreviewed ones highlighted.
  (3) A review panel on the lesson asks whether it is correct, pitched right and clear, has a suggestion box for each
  part (notes, worked example, each practice question), and asks whether they want a name credit. (4) Reviews join the
  Monday Jira digest, grouped by lesson, alongside automatic checks such as recomputing a suggested answer. (5) The
  owner approves each suggestion before anything changes, and "Reviewed by" appears only after the owner approves the
  review and the volunteer agrees to be named. Anyone with a link can only suggest, so bad reviews cost nothing.
  Review statuses then show which lessons are solid and feed the roadmap.
- Read the first month of Analytics.

**Test:** we know baseline traffic and which lessons people finish.

### 2. Reach (months 1 to 3)

- Make the first mission pack and give it away to teachers and parents in return for an email address. Adults only.
- Take it to home-education groups, STEM ambassadors and British Science Week (March).
- Fill the gaps in the missions (forces, energy) and add a closing simulator to each mission, as "Get to orbit" has.
- Put later packs on sale.
- Corporate sponsors (parked, Jira KAN-52), only after a named reviewer and a month of visitor numbers. A "Supported
  by" credit on a mission, never adverts, data or a say over content. Order of fit: space, chip and civil engineering
  firms (UK and European), then engineering firms with some defence work (approach their space side), then banks for a
  maths mission, and mainly-defence firms only after a teacher reviewer has said how a school would see it. List:
  `~/stella-work/outreach/sponsors.md`. Imperial alumni at these firms can make introductions.
- Run a small pilot with one school or club, and draft a grant bid with the partner as host.

**Test:** 5,000 monthly visitors and 200 adult email addresses.

### 3. Accounts and Plus (months 3 to 6)

- Login as already agreed: the first missions are open; going further needs an account; an adult creates the account
  for anyone under 13. Lesson pages stay open so search engines and visitors can reach them.
- Progress saved to the account, auto-marked practice questions, mission certificates.
- Launch Plus to the email list first.

**How people join (decided 14 October 2026).** The model follows UK school maths sites such as Dr Frost, where
schools create the accounts, rather than Khan Academy's, which is built around US law (COPPA) and parental consent.
Under UK GDPR a school can rely on its own job of educating pupils instead of asking every parent for consent, and
EU countries set the age a child can consent for themselves anywhere from 13 to 16, so consent-led sign-up does
not travel. Individuals can still join.

| Who | How they join | What it needs |
| --- | --- | --- |
| Anyone, any age | No account: lessons stay open and progress is kept in the browser, as now | Nothing new |
| Pupils through school | Teacher's class link. The school is the data controller; Stella is its processor | A data processing agreement with the school |
| 13 and over (UK) | Signs up themselves | Plain sign-up explanation, privacy on by default (Children's Code) |
| Under 13 | A parent or carer makes a parent account and adds the child to it | Confirm the parent's email; the parent can see, change and delete the child's data |

Build order: school class accounts first; then self sign-up for 13 and over and parent accounts; other EU countries
only when there is demand, because their age limits differ. Children get a username and password only, with no
email address; the adult's email holds the account. Data stays in Europe: Firestore is already in eur3, but Clerk
stores data in the US by default, so check its EU options before building, and use Firebase Authentication if they
fall short. Before any of it goes live, write a DPIA for accounts and review `docs/privacy/` (action 8 there).

**Test:** 50 paying subscribers.

### 4. Scale (months 6 to 12)

- AI tutor inside Plus.
- School licence.
- Set up the company if one of the triggers under "Seed funding" has been met, and get a short legal opinion on the
  NASA rules and the children's-data position.

**Test:** income covers hosting, tools and an agreed number of paid hours a month.

## Decisions still open

1. Teachers or parents first? (This plan assumes teachers.)
2. Who will be the academic or teacher partner?
3. Hours a week available.
4. Sign-in provider (Clerk or Firebase Authentication; see "How people join"). The privacy policy's owner and
   contact email were settled on 14 October 2026.
