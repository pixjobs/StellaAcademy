# Stella Academy

Physics and maths you can play with: short interactive lessons for ages 9 and up, set against the story of getting to
space.

- Live site: https://www.stella-academy.org
- Source: https://github.com/pixjobs/StellaAcademy

## What is on the site

- **29 lessons** in four stages: key stage 2 (ages 9 to 11), key stage 3 (11 to 14), GCSE (14 to 16) and A-level
  (16 to 18). Each lesson quotes the Department for Education curriculum statements it covers
  (`frontend/src/lib/curriculum.ts`); it is not matched to one exam board. Each lesson has a short explanation, a model to
  play with, a worked example and practice questions.
- **Stella's journey** (`/journey`): the lessons arranged as five missions, from number skills to reading starlight.
  Progress is ticked off by the learner and kept in their own browser.
- **Launch sequence**: real NASA launch footage that leads into an orbit simulation, on the home page and the gravity
  lesson. Six other lessons have a short piece of real footage behind a "See it for real" button.
- **NASA image gallery** (`/gallery`): a search of the NASA Image and Video Library.

There are no accounts and no AI tutor at present. Both are planned: see `docs/roadmap.md`.

The lessons were drafted with AI and have been checked for arithmetic and for errors of explanation
(`docs/content-audit.md`), but they have not yet been reviewed by a teacher.

## How it is built

Everything lives in `frontend/`:

- Next.js (App Router) with React and Tailwind CSS. Every page is static; the only server code is three small routes
  under `src/app/api` (`health`, `apod`, `search-nasa`).
- Lesson content: `src/lib/study-modules.ts`. Levels: `src/lib/levels.ts`. Missions: `src/lib/missions.ts`.
- Lesson page: `src/app/study/[id]/page.tsx`. Interactive models: `src/components/GSAPSimulation.tsx` and
  `src/components/paper/`.
- Footage: `public/launch/` and `public/intros/`, each with a `CREDITS.md` giving the NASA source of every clip.
- Analytics: Google Analytics 4 with Consent Mode, off until the visitor accepts (`src/components/Analytics.tsx`).

## Run it locally

```bash
cd frontend
npm ci
cp .env.example .env.local   # optional: add NASA_API_KEY
npm run dev                  # http://localhost:3000
```

Other commands, all run from `frontend/`:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, failing on any warning |
| `npx tsc --noEmit` | Type check |

## Deploy

The site runs as one Cloud Run service. See [DEPLOYMENT.md](DEPLOYMENT.md).

## History

Stella Academy began as a hackathon entry (https://devpost.com/software/stella-academy): space missions led by an AI
tutor running on an open model, with sign-in and a background worker. That build has been retired and its login,
worker and chat code removed. A few of its components are still in the repository, unused.

## Licence and credits

Code: Apache 2.0 (see `LICENSE`). Photographs and footage: NASA, credited per file. Stella Academy is not part of NASA
and is not endorsed by it.
