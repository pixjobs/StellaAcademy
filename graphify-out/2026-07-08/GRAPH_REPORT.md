# Graph Report - StellaAcademy  (2026-07-07)

## Corpus Check
- 102 files · ~328,874 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 918 nodes · 1620 edges · 57 communities (49 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d045c8ac`
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
- [[_COMMUNITY_earthObserver.ts|earthObserver.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_Role|Role]]
- [[_COMMUNITY_ChatDisplay.tsx|ChatDisplay.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_mission.ts|mission.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_spacePoster.ts|spacePoster.ts]]
- [[_COMMUNITY_AboutContent.tsx|AboutContent.tsx]]
- [[_COMMUNITY_builders.ts|builders.ts]]
- [[_COMMUNITY_mission-computer.ts|mission-computer.ts]]
- [[_COMMUNITY_missions.ts|missions.ts]]
- [[_COMMUNITY_apod.ts|apod.ts]]
- [[_COMMUNITY_llm-call.ts|llm-call.ts]]
- [[_COMMUNITY_components.json|components.json]]
- [[_COMMUNITY_apod.shared.ts|apod.shared.ts]]
- [[_COMMUNITY_store.ts|store.ts]]
- [[_COMMUNITY_useMissionPlanGenerator.ts|useMissionPlanGenerator.ts]]
- [[_COMMUNITY_core.ts|core.ts]]
- [[_COMMUNITY_MissionControl.tsx|MissionControl.tsx]]
- [[_COMMUNITY_TopicSelector.tsx|TopicSelector.tsx]]
- [[_COMMUNITY_🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)|🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)]]
- [[_COMMUNITY_rocketLab.ts|rocketLab.ts]]
- [[_COMMUNITY_roverCam.ts|roverCam.ts]]
- [[_COMMUNITY_search.ts|search.ts]]
- [[_COMMUNITY_getNasaApiKey|getNasaApiKey]]
- [[_COMMUNITY_LlmBottleneck|LlmBottleneck]]
- [[_COMMUNITY_searchNIVL|searchNIVL]]
- [[_COMMUNITY_button.tsx|button.tsx]]
- [[_COMMUNITY_headReachable|headReachable]]
- [[_COMMUNITY_variety.ts|variety.ts]]
- [[_COMMUNITY_fetchWithRetry|fetchWithRetry]]
- [[_COMMUNITY_fetchEPICSmart|fetchEPICSmart]]
- [[_COMMUNITY_Locker|Locker]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_ImageSelector.tsx|ImageSelector.tsx]]
- [[_COMMUNITY_prompts.ts|prompts.ts]]
- [[_COMMUNITY_json.ts|json.ts]]
- [[_COMMUNITY_llm-client.ts|llm-client.ts]]
- [[_COMMUNITY_dotenv-config.js|dotenv-config.js]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_config|config]]
- [[_COMMUNITY_GoogleSearchFn|GoogleSearchFn]]

## God Nodes (most connected - your core abstractions)
1. `Role` - 22 edges
2. `compilerOptions` - 21 edges
3. `EnrichedMissionPlan` - 19 edges
4. `missionEarthObserver()` - 16 edges
5. `compilerOptions` - 16 edges
6. `scripts` - 15 edges
7. `useGame` - 15 edges
8. `missionRocketLab()` - 15 edges
9. `logger` - 15 edges
10. `WorkerContext` - 13 edges

## Surprising Connections (you probably didn't know these)
- `missionRocketLab()` --indirect_call--> `t()`  [INFERRED]
  frontend/src/workers/ollama/mission-computer/missions/rocketLab.ts → frontend/src/workers/ollama/prompts/templates.ts
- `Home()` --calls--> `useGame`  [EXTRACTED]
  frontend/src/app/page.tsx → frontend/src/lib/store.ts
- `fetchWithRetry()` --indirect_call--> `err()`  [INFERRED]
  frontend/src/lib/nasa.ts → frontend/src/workers/ollama/server.ts
- `initializeContext()` --calls--> `getNasaApiKey()`  [INFERRED]
  frontend/src/workers/ollama/context.ts → frontend/src/workers/ollama/ollama-client.ts
- `retry()` --indirect_call--> `err()`  [INFERRED]
  frontend/src/workers/ollama/mission-computer/shared/core.ts → frontend/src/workers/ollama/server.ts

## Import Cycles
- None detected.

## Communities (57 total, 8 thin omitted)

### Community 0 - "job-handlers.ts"
Cohesion: 0.06
Nodes (48): AskJobData, LibraryBackfillJobData, MissionJobData, TutorPreflightJobData, TutorPreflightOutput, TutorPreflightPayload, EnrichedMissionPlan, clampStr() (+40 more)

### Community 1 - "http.ts"
Cohesion: 0.05
Nodes (52): ApodItem, MarsPhoto, fetchAPOD(), getApod(), normalizeApod(), fetchJsonGsfc(), fetchJsonNasa(), backoffDelay() (+44 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (45): dependencies, bullmq, class-variance-authority, @clerk/nextjs, @clerk/themes, clsx, dotenv, express (+37 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (40): devDependencies, autoprefixer, client-only, dotenv-cli, eslint, eslint-config-next, @eslint/eslintrc, mdast-util-math (+32 more)

### Community 4 - "mission-library.ts"
Cohesion: 0.10
Nodes (37): ALL_MISSION_TYPES, ALL_ROLES, LibraryBackfillResult, assertDb(), backfillOne(), backfillRole(), baseCollection(), BottleneckInstance (+29 more)

### Community 5 - "route.ts"
Cohesion: 0.09
Nodes (27): db, GET(), getUserId(), isAskResult(), isLlmJobResult(), isNestedMissionResult(), jobsCollection, POST() (+19 more)

### Community 6 - "server.ts"
Cohesion: 0.09
Nodes (26): RootLayout(), config, isPublicRoute, protectedMw, HandlerOutput, bootstrap(), checkSearchModuleResolvable(), loadEnvFiles() (+18 more)

### Community 7 - "llm.ts"
Cohesion: 0.06
Nodes (28): CachePolicy, ChatMessage, EnrichedTopic, EpicImage, EpicImageType, InlineCitation, JobFailureResult, JobIgnoredResult (+20 more)

### Community 8 - "nasa.ts"
Cohesion: 0.06
Nodes (28): Apod, CacheVal, EpicImageType, EpicKind, EpicMeta, EpicSmartItem, EpicSmartOptions, HEAD_HARD_MS (+20 more)

### Community 9 - "earthObserver.ts"
Cohesion: 0.11
Nodes (27): AvailableDate, buildArchiveHref(), epicAvailableDates(), epicByDate(), EpicImageType, EpicKind, epicLatest(), EpicMeta (+19 more)

### Community 10 - "compilerOptions"
Cohesion: 0.08
Nodes (25): tsconfig-paths, compilerOptions, allowJs, allowSyntheticDefaultImports, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental (+17 more)

### Community 11 - "Role"
Cohesion: 0.17
Nodes (20): buildContext(), CleanTopic, EarthObserverPage(), reorderImages(), buildContext(), CleanTopic, reorderImages(), RocketLabPage() (+12 more)

### Community 12 - "ChatDisplay.tsx"
Cohesion: 0.11
Nodes (14): ChatDisplayProps, Message, MessageBubble, ROLE_STYLES, scrollContainerStyles, ChatInput(), ChatInputProps, MarkdownRenderer() (+6 more)

### Community 13 - "layout.tsx"
Cohesion: 0.11
Nodes (14): metadata, RootLayoutProps, Providers(), AppBackground(), Props, ConditionalBackgrounds(), prefersReducedMotion(), Props (+6 more)

### Community 14 - "mission.ts"
Cohesion: 0.13
Nodes (15): INotesContext, NotesContext, NotesProvider(), NotesProviderProps, INoteStorage, LocalStorageNoteStorage, AssessmentItem, Difficulty (+7 more)

### Community 15 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, baseUrl, esModuleInterop, isolatedModules, lib, module, moduleResolution, noEmit (+12 more)

### Community 16 - "spacePoster.ts"
Cohesion: 0.15
Nodes (18): APOD_TERMS_MAX, buildNivlSeeds(), composeFallbackTopics(), dedupeAndCleanImages(), HARD_MS, missionSpacePoster(), NIVL_ATTEMPTS, NIVL_LINES_MAX (+10 more)

### Community 17 - "AboutContent.tsx"
Cohesion: 0.14
Nodes (7): AboutContent(), PlanetConfig, planetData, Sun(), TextureKey, texturePaths, tx()

### Community 18 - "builders.ts"
Cohesion: 0.19
Nodes (9): SignInPage(), toSafeRelative(), audienceSpec, audienceIntroLine(), buildRocketLabTopicPrompt(), buildTutorSystem(), headers, t() (+1 more)

### Community 19 - "mission-computer.ts"
Cohesion: 0.24
Nodes (11): WorkerContext, getLlmBottleneck(), Task, computeMission(), clamp(), dedupeByHref(), missionCelestialInvestigator(), sortBest() (+3 more)

### Community 20 - "missions.ts"
Cohesion: 0.19
Nodes (11): firebase-admin, db(), FRESH_MS, getAdmin(), getMissionPlan(), HARD_TTL_MS, MissionDoc, missionDocId() (+3 more)

### Community 21 - "apod.ts"
Cohesion: 0.22
Nodes (13): GET(), getSMaxAge(), Apod, dbg(), getApod(), maskKey(), NasaApodResponse, NextRequestInit (+5 more)

### Community 22 - "llm-call.ts"
Cohesion: 0.18
Nodes (13): backoffDelay(), Bottleneck, callJsonArrayWithBottleneck(), callWithBottleneck(), getGate(), getQueueStats(), LLM_BACKOFF_CAP, LLM_MAX_RETRIES (+5 more)

### Community 23 - "components.json"
Cohesion: 0.14
Nodes (13): aliases, components, utils, rsc, $schema, style, tailwind, baseColor (+5 more)

### Community 24 - "apod.shared.ts"
Cohesion: 0.23
Nodes (13): Apod, dbg(), fetchWithRetry(), getApod(), maskKey(), NasaApodResponse, NextRequestInit, pickBestMediaUrl() (+5 more)

### Community 25 - "store.ts"
Cohesion: 0.17
Nodes (9): Home(), missions, roles, IntroOverlayProps, GameActions, GameState, GameStateProperties, initialState (+1 more)

### Community 26 - "useMissionPlanGenerator.ts"
Cohesion: 0.22
Nodes (10): Message, UseMissionChatParams, MissionGenerationStatus, checkJobStatus(), JobStatus, RawJobResultPayload, startJob(), AskResult (+2 more)

### Community 27 - "core.ts"
Cohesion: 0.23
Nodes (11): ensureImageList(), ensureTopic(), extractFirstJsonArray(), jitter(), NivlQueryOptions, retry(), RetryOpts, sleep() (+3 more)

### Community 28 - "MissionControl.tsx"
Cohesion: 0.20
Nodes (10): ChatPanel, ChatPanelProps, MissionControlInternal(), MissionControlProps, TabButton, TabButtonProps, VisualPanel, VisualPanelProps (+2 more)

### Community 29 - "TopicSelector.tsx"
Cohesion: 0.18
Nodes (8): isRecord(), LightboxProps, MissionImage, normalizeImages(), RawImage, Topic, TopicCardProps, TopicSelectorProps

### Community 30 - "🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)"
Cohesion: 0.18
Nodes (10): 1) Secrets (Google Secret Manager), 2) Cloud Tasks queues (production), 3) IAM bindings (one-time), 4) Cloud Build deployment, 5) Local development (local queue), 6) Secret management commands (examples), 7) Health checks & endpoints, 8) Troubleshooting (+2 more)

### Community 31 - "rocketLab.ts"
Cohesion: 0.31
Nodes (10): audience(), buildPrompt(), fallbackTopics(), missionRocketLab(), RawMission, RawTopic, sanitizeSearchSeeds(), validate() (+2 more)

### Community 32 - "roverCam.ts"
Cohesion: 0.22
Nodes (8): cameraInfo, isMarsPhotoArray(), MARS_ATTEMPTS, MARS_LIMIT_HINT, MAX_PER_CAMERA, MIN_TOTAL, missionRoverCam(), sortNewestFirst()

### Community 33 - "search.ts"
Cohesion: 0.27
Nodes (9): clampNum(), googleCustomSearch(), GoogleErrorResponse, GoogleSearchItem, GoogleSearchResponse, mask(), sanitizeQuery(), searchService (+1 more)

### Community 34 - "getNasaApiKey"
Cohesion: 0.25
Nodes (9): epicGet(), fetchAPOD(), fetchLatestMarsPhotos(), gsfcApiUrl(), log(), nasaMirrorApiUrl(), upgradeHttps(), getApiKey() (+1 more)

### Community 36 - "searchNIVL"
Cohesion: 0.32
Nodes (6): GET(), POST(), RequestPayload, mapWithConcurrency(), NivlItem, searchNIVL()

### Community 37 - "button.tsx"
Cohesion: 0.29
Nodes (4): NotebookPanelProps, Button, ButtonProps, buttonVariants

### Community 38 - "headReachable"
Cohesion: 0.32
Nodes (8): cachedJson(), getCached(), headReachable(), largestByNameGuess(), now(), pickBestNivlAsset(), setCached(), warn()

### Community 39 - "variety.ts"
Cohesion: 0.32
Nodes (7): CHALLENGES, LENSES, makeVariety(), OUTPUTS, pick(), rng(), VarietyRecipe

### Community 40 - "fetchWithRetry"
Cohesion: 0.29
Nodes (7): doFetch(), expBackoffWithJitter(), fetchJsonSafe(), fetchWithRetry(), headOrRangeCheck(), isTransientError(), shouldRetry()

### Community 41 - "fetchEPICSmart"
Cohesion: 0.29
Nodes (7): epicArchiveUrl(), epicAvailableDates(), epicByDate(), fetchEPICSmart(), pad2(), pickSome(), seededRng()

### Community 43 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 45 - "prompts.ts"
Cohesion: 0.83
Nodes (3): audienceIntro(), buildRocketLabTopicPrompt(), rocketLabTopicPrompt()

### Community 46 - "json.ts"
Cohesion: 0.83
Nodes (3): extractFirstJsonArray(), extractJson(), stripFences()

## Knowledge Gaps
- **370 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+365 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `compilerOptions`, `devDependencies`, `missions.ts`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `firebase-admin` connect `missions.ts` to `dependencies`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `tsconfig-paths` connect `compilerOptions` to `dependencies`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _370 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `job-handlers.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05576923076923077 - nodes in this community are weakly interconnected._
- **Should `http.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053551912568306013 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._