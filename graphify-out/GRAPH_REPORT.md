# Graph Report - StellaAcademy  (2026-07-08)

## Corpus Check
- 35 files · ~288,924 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 307 nodes · 309 edges · 28 communities (21 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `540738e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_job-handlers.ts|job-handlers.ts]]
- [[_COMMUNITY_http.ts|http.ts]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_mission-library.ts|mission-library.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_server.ts|server.ts]]
- [[_COMMUNITY_llm.ts|llm.ts]]
- [[_COMMUNITY_nasa.ts|nasa.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_ChatDisplay.tsx|ChatDisplay.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_mission.ts|mission.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_apod.ts|apod.ts]]
- [[_COMMUNITY_components.json|components.json]]
- [[_COMMUNITY_store.ts|store.ts]]
- [[_COMMUNITY_🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)|🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_ImageSelector.tsx|ImageSelector.tsx]]
- [[_COMMUNITY_dotenv-config.js|dotenv-config.js]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_config|config]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 21 edges
2. `compilerOptions` - 16 edges
3. `scripts` - 15 edges
4. `Stella Academy - Plan for Conversion to Explorer Tool` - 11 edges
5. `🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)` - 10 edges
6. `Note` - 8 edges
7. `tailwind` - 6 edges
8. `INoteStorage` - 5 edges
9. `LocalStorageNoteStorage` - 5 edges
10. `Proposed Features` - 5 edges

## Surprising Connections (you probably didn't know these)
- `INotesContext` --references--> `Note`  [EXTRACTED]
  frontend/src/lib/notes/NotesContext.tsx → frontend/src/types/mission.ts
- `GET()` --calls--> `getApod()`  [EXTRACTED]
  frontend/src/app/api/apod/route.ts → frontend/src/lib/apod.ts
- `POST()` --calls--> `searchNIVL()`  [EXTRACTED]
  frontend/src/app/api/search-nasa/route.ts → frontend/src/lib/nasa.ts

## Import Cycles
- None detected.

## Communities (28 total, 7 thin omitted)

### Community 0 - "job-handlers.ts"
Cohesion: 0.07
Nodes (26): Current State Assessment, Dependencies to Remove, Deprecation Schedule, File Changes Summary, Files to ADD, Files to DELETE, Files to MODIFY, Google Cloud Resources to Keep/Remove (+18 more)

### Community 1 - "http.ts"
Cohesion: 0.13
Nodes (15): scripts, //2, //3, build, build:web, build:worker, db:seed, dev (+7 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (36): dependencies, class-variance-authority, clsx, dotenv, express, gcp-metadata, google-auth-library, hast-util-to-string (+28 more)

### Community 3 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, client-only, dotenv-cli, eslint, eslint-config-next, @eslint/eslintrc, mdast-util-math (+13 more)

### Community 4 - "mission-library.ts"
Cohesion: 0.18
Nodes (11): 1. NASA Gallery (Primary Feature), 2. Space Facts Engine, 3. Interactive Mission Simulators (No AI), 4. Community Highlights, Cadet (Teens) "Space Researcher", Core Concept, Explorer (Kids) "Space Explorer", New Features & Direction (+3 more)

### Community 8 - "nasa.ts"
Cohesion: 0.13
Nodes (14): POST(), RequestPayload, Apod, cachedJson(), CacheVal, doFetch(), jsonCache, MarsPhoto (+6 more)

### Community 10 - "compilerOptions"
Cohesion: 0.08
Nodes (25): tsconfig-paths, compilerOptions, allowJs, allowSyntheticDefaultImports, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental (+17 more)

### Community 12 - "ChatDisplay.tsx"
Cohesion: 0.16
Nodes (9): MarkdownRenderer(), MathNode, Props, remarkMathFromFencedCode(), Button, ButtonProps, buttonVariants, TooltipContent (+1 more)

### Community 13 - "layout.tsx"
Cohesion: 0.24
Nodes (6): metadata, RootLayoutProps, Providers(), Footer(), QUOTES, Header()

### Community 14 - "mission.ts"
Cohesion: 0.09
Nodes (22): INotesContext, NotesContext, NotesProviderProps, INoteStorage, LocalStorageNoteStorage, ALL_MISSION_TYPES, ALL_ROLES, AssessmentItem (+14 more)

### Community 15 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, baseUrl, esModuleInterop, isolatedModules, lib, module, moduleResolution, noEmit (+12 more)

### Community 21 - "apod.ts"
Cohesion: 0.43
Nodes (5): GET(), getSMaxAge(), Apod, getApod(), NasaApodResponse

### Community 23 - "components.json"
Cohesion: 0.14
Nodes (13): aliases, components, utils, rsc, $schema, style, tailwind, baseColor (+5 more)

### Community 25 - "store.ts"
Cohesion: 0.29
Nodes (6): GameActions, GameState, GameStateProperties, initialState, Role, useGame

### Community 30 - "🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)"
Cohesion: 0.18
Nodes (10): 1) Secrets (Google Secret Manager), 2) Cloud Tasks queues (production), 3) IAM bindings (one-time), 4) Cloud Build deployment, 5) Local development (local queue), 6) Secret management commands (examples), 7) Health checks & endpoints, 8) Troubleshooting (+2 more)

### Community 43 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

## Knowledge Gaps
- **210 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `compilerOptions`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `tsconfig-paths` connect `compilerOptions` to `dependencies`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _210 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `job-handlers.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `http.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._