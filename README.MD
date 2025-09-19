# ✨ Stella Academy
**Personalised space-learning missions powered by open models (gpt-oss)**

---

## 📺 Demo & Links
- Live demo: https://stella-academy.org
- Source code: https://github.com/pixjobs/StellaAcademy
- Devpost page: https://devpost.com/software/stella-academy

### Judge Login (pre-configured in Clerk)
We created a dedicated test user so judges can log in without signing up:

- Email: judge@stella-academy.org
- Password: StellaRocks2025!

---

## 🚀 What we built
**Stella Academy** is a mission-based learning app where learners explore space with an AI tutor called **Stella**.  
Learners pick a role, and Stella adapts her teaching style:

- Explorer (Kid): simple words, fun facts, storytelling
- Cadet (Teen): hypothesis-driven, critical thinking prompts
- Scholar (Uni): Socratic dialogue, deeper analysis

### Missions
- Rocket Lab: identify rocket parts, decide launch readiness, detect anomalies
- Earth Observer: find continents, explain storm systems, analyse seasonal cloud patterns
- Space Poster: poems for kids, captions for teens, abstracts for scholars

---

## 🌍 Why it matters
- For Humanity: lowers barriers to STEM education with playful, adaptive AI.
- Impact: can run **fully offline with gpt-oss via Ollama**, making it usable in classrooms, rural areas, or disaster relief contexts.
- Generalisation: the same role/mission structure applies beyond space (biology, climate, history).

---

## ✨ What’s novel
- Role-conditioned prompts: same model, different pedagogy per learner.
- Mission scaffolding: bite-sized steps keep the AI focused, safe, and engaging.
- Local-first option: runs on gpt-oss via Ollama — no cloud needed if installed locally.
- Safe by design: kid/teen/uni guardrails, UI hints, and no dark patterns.

---

## 🧱 Architecture (Updated)
- Frontend: Next.js (App Router) on Cloud Run — service name “stella-web”
- Worker: Node/Express on Cloud Run — service name “stella-worker” (private)
- Job delivery
  - Local development: **local queue** — web calls worker directly at DEV_WORKER_URL (HTTP POST /jobs) and returns results immediately
  - Production: **Google Cloud Tasks**
    - Queues: interactive-llm-tasks and background-llm-tasks (region europe-west1)
    - Web enqueues a task with OIDC; Cloud Tasks invokes stella-worker /jobs

### Secrets via Google Secret Manager (GSM)
Required (production):
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLOUD_RUN_WORKER_URL
- INTERACTIVE_TASKS_QUEUE_ID  (e.g., interactive-llm-tasks)
- BACKGROUND_TASKS_QUEUE_ID   (e.g., background-llm-tasks)
- OLLAMA_BASE_URL

Optional:
- REDIS_URL_ONLINE
- GOOGLE_CUSTOM_SEARCH_KEY
- GOOGLE_CUSTOM_SEARCH_CX
- OLLAMA_BEARER_TOKEN
- NASA_API_KEY

Notes:
- Project ID and Cloud Tasks invoker SA are auto-derived at runtime; no secrets for these.
- Grant both runtime service accounts roles/secretmanager.secretAccessor on the needed secrets.
- Grant the web runtime SA roles/cloudtasks.enqueuer.
- Allow the web runtime SA to invoke the worker (roles/run.invoker on stella-worker).

### Request flow
1. User signs in (Clerk middleware)
2. Web API receives a mission/job
3. Local dev: web posts to DEV_WORKER_URL /jobs and returns the result
4. Production: web enqueues a Cloud Task → Cloud Tasks posts to stella-worker /jobs with OIDC
5. Worker executes the job and persists/returns results

---

## 🧪 Quickstart (Local Dev)
1) Copy .env.example to .env.local and add Clerk keys.  
2) Optional: start a local Redis if you use Redis-backed features  
   docker run --name local-redis -p 6379:6379 -d redis  
3) Start the services  
   Terminal 1: npm run dev        (web)  
   Terminal 2: npm run worker     (worker)  
4) The web will talk directly to the worker at DEV_WORKER_URL (default http://127.0.0.1:8080).

---

## ⛅ Deploy (Cloud Build → Cloud Run)
Submit from the repo root:

gcloud builds submit --config cloudbuild.web.yaml .  
gcloud builds submit --config cloudbuild.worker.yaml .

What the web build/deploy does:
- Builds Next.js in standalone mode (Dockerfile.web)
- Deploys with Clerk secrets, worker URL, and queue IDs
- Uses startup CPU boost, 600s timeout, concurrency 40

What the worker build/deploy does:
- Compiles TypeScript to dist and verifies dist/workers/ollama/server.js exists
- Deploys as private service with the required secrets
- Uses startup CPU boost, 600s timeout, concurrency 4

---

## 🎥 Demo script
1) Log in as judge (credentials above)  
2) Show role picker (Explorer → Cadet → Scholar)  
3) Run Rocket Lab mission  
4) Switch role mid-demo to show adaptation  
5) Show Earth Observer with a quick query  
6) Finish with Space Poster → Stella writes a poem  
Tip: Keep it under 3 minutes; highlight impact + offline capability

---

## ✅ Hackathon checklist
- Built with gpt-oss  ✓
- Live demo          ✓
- Public repo        ✓
- Video (<3 mins)    ✓
- Judge credentials  ✓
- OSS-friendly license ✓

---

## 📜 License
Apache 2.0 or MIT (see LICENSE). NASA images are public domain.

---

## 🙏 Acknowledgements
- OpenAI for gpt-oss
- NASA for APOD images
- Clerk for auth
- GSAP for animations
