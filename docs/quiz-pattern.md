# Step-by-step quizzes

Every lesson gets a quiz that a pupil cannot shortcut. The owner chose this approach (Jira epic KAN-70) because it
adds real value: the reasoning has to be shown, step by step, before the answer counts. The first two were
"Measures and Converting Units" (KAN-69) and "Fractions, Decimals and Percentages" (KAN-71).

A quiz is lesson content, so it goes through [the content workflow](content-workflow.md): a brief agreed with the
owner, the build, the automatic checks, a fresh review by someone who did not build it, owner review, then ship.

## What a pupil sees

- The quiz is in the lesson's **Try it** panel at the top of the page. A lesson with its own explore tools (such as
  Measures) has **Explore** and **Quiz** tabs. A lesson without them shows the quiz there directly.
- The **Practice** section further down says where the quiz is and links to it. It prints no answers.
- A quiz has two to four **rounds**, such as "Convert" or "Percentage of an amount". A round is ten questions.
- Each question is answered in **steps**: the reasoning first, then the answer. A step only appears when the one
  before it is right. A wrong step is struck out, with feedback that says why.
- A question counts as **right first time** only if every step was right at the first try, without "Show me how".
- Missed questions come back for **review** after 1 day, then 3 days, then a week. Scores and the review list are
  kept in the browser only; nothing is sent to the server.

## Rules for every quiz

1. **Reasoning before the answer.** Steps ask what the pupil should decide (which unit is bigger, multiply or
   divide, which fraction, which ratio), then for the intermediate numbers, then the answer.
2. **No step gives away a later one.** Feedback says what to do, not the answer.
3. **New numbers every time.** Questions are generated from a random seed, and the same seed always gives the
   same question, so a missed question can come back exactly.
4. **Never ask what the page shows.** Each generator excludes the examples in the idea, worked example and notes.
5. **Name the classic mistakes.** The brief lists the misconceptions (at most four). Each gets feedback that names
   it, and the automatic check proves the feedback fires.
6. **Answers are exact.** Arithmetic uses decimal strings and whole-number fractions, never floating point.
7. **Marking accepts what a pupil would type:** commas or none, a leading 0 or none, the unit or none, "about" for
   rough answers, "£" for money, fractions such as 7/20 or 2 3/4. It refuses the wrong unit (pence for pounds) and
   an equal fraction that is not in its simplest form when the simplest form is asked for.
8. **Hard to game.** A slip or "Show me how" is saved straight away. Unfinished rounds stay in the history.
   While a question is in progress the lesson's explore tools pause. The right option's position is shuffled.
9. **Calculators:** key stages 2 and 3 are worked without one. GCSE and A-level allow one. A calculator answer is
   shown to 3 significant figures (keeping trailing zeros, such as 13.0), and anything within half a unit of the
   third significant figure, or within 0.2% of the exact value, is right, so rounding along the way is not
   penalised. An answer rounded too far (37 for 36.87) gets "give your answer to 3 significant figures".
10. **House style** as for all lesson text: UK English, plain words, no em dashes, sentence case.

## How it is built

| Part | File |
| --- | --- |
| Engine: step types, random numbers, exact arithmetic, marking | `frontend/src/lib/quiz/core.ts` |
| One lesson's questions | `frontend/src/lib/quiz/<lesson>.ts`, exporting a `LessonQuiz` |
| Which lessons have a quiz | `frontend/src/lib/quiz/index.ts` (`QUIZZES`) |
| Saved scores and review list | `frontend/src/lib/quiz/progress.ts` (one localStorage key per lesson) |
| Pausing explore tools during a question | `frontend/src/lib/quiz/active.ts` |
| The quiz on screen | `frontend/src/components/quiz/QuizPanel.tsx`, placed by `components/study/LessonModel.tsx` |
| Automatic check | `frontend/scripts/content-checks/quiz.ts` plus `quiz/<lesson>.ts` (an independent verifier) |

Step types: `choice` (options, the right one, feedback for each wrong one), `number` (an exact decimal, negative
allowed, an optional unit such as `%`, `£`, `km`, `cm²`, `°` or `m/s`, `exact` for a calculator answer from
`approx()`, and `plain` for a binary number) and `fraction` (an exact fraction, simplest form, a fixed bottom
number, or a mixed number). New types are added to the engine only when a lesson needs one.

Maths in quiz text is written as markup that `QuizPanel` draws: `10^{-3}` for a power (the site's font has no
superscript digits beyond ¹²³), `[[3;−2]]` for a column vector and `[[1,2;3,4]]` for a 2 × 2 matrix. Screen
readers hear "to the power", "column vector" and "matrix".

Answers that are expressions (calculus) are split into steps that each ask for one number: the new coefficient,
the new power, then a value. No algebra has to be typed.

### Adding a quiz to a lesson

1. Write the brief in the lesson's Jira story under KAN-70: rounds, the steps of each question type, the
   misconceptions and their feedback, what is out of scope, and which examples on the page to exclude.
2. Write `lib/quiz/<lesson>.ts`: a generator per question type, the rounds, and a `SHOWN` list of excluded examples.
3. Register it in `lib/quiz/index.ts`. If the lesson's Try it panel was the old flashcards, the quiz replaces them
   automatically. A lesson with its own model gets Explore and Quiz tabs, as in `MeasuresModel.tsx`.
4. Write the verifier in `scripts/content-checks/quiz/<lesson>.ts`. It recomputes every answer by a different route
   (mathjs, exact fractions), and lists the typed slips that must produce the named feedback. Add it to `VERIFIERS`.
5. Run `npm run check:content -- --lessons=<lesson>`. It generates 3,000 questions per round and checks the
   answers, every step, the typed forms, the units, the named mistakes and the seeds. Then plant a mistake in the
   generator and check that the check fails.
6. Play every round in a browser on desktop and phone. Setting `window.__stellaQuizSeed` (a test hook in
   `QuizPanel`) makes the quiz use known seeds, so a script can work out the same questions and play a perfect
   run. Run all browser suites with `~/stella-work/browser-checks/run-all.sh`, which fails on any FAIL line.
7. A fresh agent reviews the quiz against the brief and this page. Fix every finding, then ask the owner to review.
