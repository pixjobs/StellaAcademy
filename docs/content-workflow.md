# How lesson content is changed

Stella's reputation rests on lessons being right. This workflow keeps every change small enough to check
completely. It applies to any change to lesson text, whoever or whatever writes it, AI included.

## The rules

1. **One lesson at a time.** Finish, check and ship one lesson before starting the next. Never batch lessons.
2. **One version of each idea.** A fact, example or symbol appears in one place in a lesson. If it appears
   twice, one copy goes.
3. **Brief before writing.** Nothing is drafted until the lesson's brief (below) is agreed by the owner.
4. **Only what the brief asks for.** A draft that adds sections, topics or features not in the brief is
   rejected, however good they are. Ideas go into a new Jira ticket instead.
5. **Machines check what machines can.** Arithmetic, house style and repeated content are checked by script,
   not by reading. A check that fails blocks the change.
6. **A fresh reader checks the rest.** The person or agent that wrote the draft does not sign it off.
7. **The owner approves before it ships.** Approval is given on the rendered page, not on the source.

## The steps for one lesson

Each lesson is one Jira story under the mission's epic, with these steps as its checklist. Each step's output
goes into the ticket.

| Step | What | Output | Who |
| --- | --- | --- | --- |
| 1. Brief | Fill in the lesson brief | Brief in the ticket | Draft: Claude. Agree: owner |
| 2. Draft | Rewrite the lesson to match the brief, nothing more | One commit on a branch | Claude |
| 3. Automatic checks | Run the content checks | Pass, pasted into the ticket | Script |
| 4. Fresh read | Read the rendered lesson against the brief and the checklist below | Findings, or "none" | A fresh agent with no drafting context, or a person |
| 5. Fix | Fix every finding, then repeat steps 3 and 4 | Clean check and read | Claude |
| 6. Owner review | Look at the lesson on desktop and phone (screenshots or a preview link) | "Approved" in the ticket | Owner |
| 7. Ship | PR with the checks in its body, merge, deploy, browser checks on live | PR link and live check results | Claude |

If a step fails, go back one step. Do not skip ahead.

## The lesson brief

Short, and agreed before any writing:

- **Lesson and mission:** for example "Momentum, Mission 2, step 3 of 6".
- **Level:** where it starts and where it ends (for example "GCSE, with an A-level stretch at the end").
- **The question it answers in the mission story:** one sentence.
- **Comes from / leads to:** what the previous lesson leaves the pupil asking, and what this lesson leaves
  them asking for the next one.
- **Curriculum statements:** the DfE statements it covers, quoted from `frontend/src/lib/curriculum.ts`.
- **Must teach:** at most five points.
- **Misconceptions to tackle:** at most two.
- **Out of scope:** what this lesson does not cover, and where it is covered instead.
- **Real-world anchor:** the footage or example it uses, and the source for every fact in it.

## The fresh reader's checklist

- Every statement is true at the stated level, and nothing is simplified into something false.
- Every number in the notes, worked example and practice matches the content checks' output.
- Every fact in captions and real-world examples has a source in the ticket.
- Nothing appears twice; symbols and terms are the same everywhere in the lesson.
- Jargon is explained before it is used.
- It covers the brief's "must teach" points and misconceptions, and nothing outside the brief.
- It opens from the previous lesson and ends pointing to the next.
- House style: UK English, sentence-case headings, no em dashes, no capitals for emphasis, plain words.
- It reads well on a phone: short paragraphs, no formula wider than the screen.

## The automatic content checks

Run `npm run check:content` in `frontend/` (default: Mission 2; `--lessons=a,b` or `--all`). The code is in
`frontend/scripts/content-checks/`, and the Department for Education source texts it checks quotes against are in
`frontend/content-sources/dfe/` (download details in `SOURCES.md` there). A lesson ships only when the command
reports no failures for it (`--lessons=<id>`). The checks are:

- **Answers:** every worked example and practice answer is recomputed from its inputs and compared.
- **Style:** headings in sentence case; banned characters and words (em dashes, "Kelvin" capitalised,
  "Nm" without a space, American spellings); no words in capitals for emphasis.
- **Repeats:** no worked example or paragraph appears twice in a lesson.
- **Curriculum:** each quoted DfE statement still matches its source text.
- **Links:** every link to another lesson points to one that exists.

## Quizzes

Each lesson's step-by-step quiz is lesson content and follows this workflow too. How quizzes work, the rules every
quiz follows and how to add one are in [quiz-pattern.md](quiz-pattern.md).
