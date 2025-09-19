# 🚀 Deployment & Testing Guide (Cloud Run + Local Queues & Cloud Tasks)

This repo deploys two Cloud Run services via Cloud Build:

- **stella-web** — Next.js frontend (enqueues work)
- **stella-worker** — worker service exposing `POST /jobs` for task execution

Runtime behavior by environment:
- **Local development** → uses a **local queue** (direct HTTP to the worker at `DEV_WORKER_URL`) for fast iteration.
- **Production (Cloud Run)** → uses **Google Cloud Tasks** with OIDC to call the worker securely.

Project ID and the Cloud Tasks **invoker service account** are **auto-derived** at runtime; you do *not* store them as secrets.

---

## 1) Secrets (Google Secret Manager)

Create these once in **GSM**. Names are **exact** and referenced verbatim by the app.

Required (production):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk secret key
- `CLOUD_RUN_WORKER_URL` — HTTPS URL of the worker Cloud Run service
- `INTERACTIVE_TASKS_QUEUE_ID` — e.g. `interactive-llm-tasks`
- `BACKGROUND_TASKS_QUEUE_ID` — e.g. `background-llm-tasks`
- `OLLAMA_BASE_URL` — LLM endpoint (or Ollama gateway URL)

Optional (enable only if used):
- `REDIS_URL_ONLINE` — e.g., Upstash TLS URI
- `GOOGLE_CUSTOM_SEARCH_KEY`
- `GOOGLE_CUSTOM_SEARCH_CX`
- `OLLAMA_BEARER_TOKEN`
- `NASA_API_KEY`

Development conveniences (read by helpers; not required in prod):
- `WORKER_DEV_URL` — default `http://127.0.0.1:8080`
- `WORKER_DEV_PATH` — default `/`

Do **not** create a secret for:
- `GOOGLE_CLOUD_PROJECT` — discovered from env/metadata
- `CLOUD_TASKS_INVOKER_SA` — auto-computed from project number / defaults

---

## 2) Cloud Tasks queues (production)

You already have:
- `interactive-llm-tasks` (RUNNING)
- `background-llm-tasks` (RUNNING)

If you ever need to create them again (Europe-West1):
gcloud tasks queues create interactive-llm-tasks --location=europe-west1 --max-dispatches-per-second=20 --max-concurrent-dispatches=5 --max-burst-size=50
gcloud tasks queues create background-llm-tasks  --location=europe-west1 --max-dispatches-per-second=3  --max-concurrent-dispatches=10 --max-burst-size=5

Grant the **web runtime service account** the `roles/cloudtasks.enqueuer` role.

---

## 3) IAM bindings (one-time)

Worker (private) must allow the web runtime SA to invoke it (via Cloud Tasks OIDC):
gcloud run services add-iam-policy-binding stella-worker --region=europe-west1 --member="serviceAccount:<WEB_RUNTIME_SA_EMAIL>" --role="roles/run.invoker"

Grant Secret Manager access (web & worker runtime SAs) to the secrets listed above:
For each runtime SA, add `roles/secretmanager.secretAccessor` on secrets:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLOUD_RUN_WORKER_URL
INTERACTIVE_TASKS_QUEUE_ID
BACKGROUND_TASKS_QUEUE_ID
OLLAMA_BASE_URL
(Optionally) REDIS_URL_ONLINE, GOOGLE_CUSTOM_SEARCH_KEY, GOOGLE_CUSTOM_SEARCH_CX, OLLAMA_BEARER_TOKEN, NASA_API_KEY

---

## 4) Cloud Build deployment

Two configs at repo root:
- `cloudbuild.web.yaml` → builds & deploys **stella-web**
- `cloudbuild.worker.yaml` → builds & deploys **stella-worker**

Deploy web:
gcloud builds submit --config cloudbuild.web.yaml .

Deploy worker:
gcloud builds submit --config cloudbuild.worker.yaml .

What web deploy does:
- Builds Next.js (standalone) using `Dockerfile.web`
- Deploys with secrets: Clerk keys, `CLOUD_RUN_WORKER_URL`, and **queue IDs**
- Auto-derived at runtime: project ID & Cloud Tasks invoker SA
- Perf tuning: startup CPU boost, 600s timeout, concurrency 40

What worker deploy does:
- Builds TS worker bundle using `Dockerfile.worker` (fails build if `dist/workers/ollama/server.js` is missing)
- Deploys as **private** service; reads GSM secrets as needed
- Perf tuning: startup CPU boost, 600s timeout, concurrency 4

Note: We removed log-tail steps in Cloud Build to avoid `${REV}` substitution issues. Use gcloud logging directly if needed.

---

## 5) Local development (local queue)

Mode A — fully local (fastest):
1) Copy `.env.example` → `.env.local`; set Clerk keys.
2) (Optional) start local Redis if you use it for other features:
   docker run --name local-redis -p 6379:6379 -d redis
3) Start services:
   Terminal 1: npm run dev      (web)
   Terminal 2: npm run worker   (worker)
4) The web app will call the worker directly at `DEV_WORKER_URL` (default `http://127.0.0.1:8080`) and return results immediately.

Mode B — hybrid (local code, cloud dependencies):
1) Authenticate with Google Cloud:
   gcloud auth application-default login
2) In `.env.local` set Clerk keys; **do not** set `REDIS_URL` if you want to use cloud Redis. The app will fetch `REDIS_URL_ONLINE` from GSM.
3) Run as in Mode A. In this mode you interact with live cloud resources; use carefully.

---

## 6) Secret management commands (examples)

Create a secret:
echo -n "<value>" | gcloud secrets create NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --replication-policy="automatic" --data-file=-

Add a new version:
echo -n "<new-value>" | gcloud secrets versions add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --data-file=-

Grant access to a runtime SA:
gcloud secrets add-iam-policy-binding NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --member="serviceAccount:<SA_EMAIL>" --role="roles/secretmanager.secretAccessor"

List secrets:
gcloud secrets list

Describe a secret:
gcloud secrets describe CLOUD_RUN_WORKER_URL

---

## 7) Health checks & endpoints

Worker must expose:
- GET `/_health` — for Cloud Run healthcheck
- POST `/jobs` — Cloud Tasks target (accepts `{ jobId, jobData }`)

Web enqueues with:
- Local: POST to `DEV_WORKER_URL` (immediate result)
- Prod: Cloud Tasks task to `${CLOUD_RUN_WORKER_URL}/jobs` with OIDC token (service account auto-computed)

---

## 8) Troubleshooting

Container fails to start (port 8080):
- Ensure the worker/server binds `0.0.0.0:$PORT` (Cloud Run sets `PORT`).
- Verify compiled entry exists at `dist/workers/ollama/server.js` (or update Dockerfile and start script).

Missing secret error in logs:
- Confirm secret name is exact.
- Ensure runtime service account has `roles/secretmanager.secretAccessor`.
- Redeploy the service to refresh mounted secrets.

Cloud Build “invalid substitution key”:
- Avoid `${VAR}` or `$VAR` in YAML that Cloud Build could treat as a template; prefer branching in bash or escape as `$$VAR` if needed.

Queues not found:
- Check region; queues are regional. Use `gcloud tasks queues list --location=europe-west1`.

---

## 9) Files of interest

- `Dockerfile.web` — Next.js standalone runner
- `Dockerfile.worker` — TypeScript worker build/runtime
- `cloudbuild.web.yaml` — deploys web with required secrets
- `cloudbuild.worker.yaml` — deploys worker with required secrets
- `src/lib/secrets.ts` — GSM-first secret resolution (exact names, env fallback)
- `src/lib/cloudTasks.ts` — local vs prod enqueue logic (auto project/SA)
