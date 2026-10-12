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
- Every lesson gets a "Report a problem" link so any teacher can flag an error.
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
- In progress: rewrite each lesson's notes and practice to the level of those statements, citing official sources
  only. Done so far (9 of 29): waves, Ohm's law, trigonometry, powers and roots, and the rest of "Get to orbit"
  (gears, momentum, thermodynamics, gravity, orbits). The other 20 still have notes pitched too high and references
  to textbooks and other sites. Next: key stage 2.
- Done 12 October 2026: new interactive models for circuits, trigonometry, gears, momentum, gases and transfer orbits
  (`frontend/src/components/lesson-models/`). Their labels are small on phones and need a pass.
- Simplify the wording of the key stage 2 lessons for ages 9 to 11.
- Publish a privacy policy (needs a named owner and a contact email).
- Read the first month of Analytics.

**Test:** we know baseline traffic and which lessons people finish.

### 2. Reach (months 1 to 3)

- Make the first mission pack and give it away to teachers and parents in return for an email address. Adults only.
- Take it to home-education groups, STEM ambassadors and British Science Week (March).
- Fill the gaps in the missions (forces, energy) and add a closing simulator to each mission, as "Get to orbit" has.
- Put later packs on sale.
- Run a small pilot with one school or club, and draft a grant bid with the partner as host.

**Test:** 5,000 monthly visitors and 200 adult email addresses.

### 3. Accounts and Plus (months 3 to 6)

- Login as already agreed: the first missions are open; going further needs an account; an adult creates the account
  for anyone under 13. Lesson pages stay open so search engines and visitors can reach them.
- Progress saved to the account, auto-marked practice questions, mission certificates.
- Launch Plus to the email list first.

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
4. Sign-in provider, and the owner and contact email for the privacy policy.
