# ✨ Stella Academy
**Personalised space-learning missions powered by open models (gpt-oss)**

---

## 📺 Demo & Links
- **Live demo:** <https://stella-academy.org>  
- **Source code:** <https://github.com/pixjobs/StellaAcademy>  
- **Devpost project page:** <https://devpost.com/software/stella-academy>

### Judge Login (pre-configured in Clerk)
We created a dedicated **test user in Clerk** so judges can log in without signing up.

- **Email:** `judge@stella-academy.org`  
- **Password:** `StellaRocks2025!`

---

## 🚀 What we built
**Stella Academy** is a mission-based learning app where learners explore space with an AI tutor called **Stella**.  
The twist: learners pick a **role**, and Stella adapts her teaching style:

- **Explorer (Kid):** simple words, fun facts, storytelling
- **Cadet (Teen):** hypothesis-driven, critical thinking prompts  
- **Scholar (Uni):** Socratic dialogue, deeper analysis  

### Missions
- **Rocket Lab:** identify rocket parts / decide launch readiness / detect anomalies  
- **Earth Observer:** find continents / explain storm systems / analyse seasonal cloud patterns  
- **Space Poster:** poems for kids, captions for teens, abstracts for scholars  

---

## 🌍 Why it matters
- **For Humanity:** lowers barriers to STEM education with playful, adaptive AI.  
- **Impact:** works offline with gpt-oss, so it’s usable in classrooms, rural areas, or disaster relief contexts.  
- **Generalisation:** the same mission/role framework applies beyond space (biology, climate, history).

---

## ✨ What makes it novel
- **Role-conditioned prompts**: the same model adapts tone and pedagogy per learner.  
- **Mission scaffolding**: bite-sized steps keep the AI focused, safe, and engaging.  
- **Local-first**: runs on `gpt-oss:20b` via Ollama — no internet required.  
- **Safe by design**: kid/teen/uni guardrails, UI hints, and no dark patterns.

---

## 🛠️ How it works
- **Frontend:** Next.js (App Router) + GSAP animations  
- **Auth:** Clerk (middleware-gated; `/sign-in/[[...rest]]`)  
- **Models:** gpt-oss via Ollama (local) or cloud provider  
- **Background:** NASA APOD for dynamic space backdrops  
- **Queue/Jobs:** Redis + BullMQ worker for background tasks  
- **Secrets:**  
  - **Local:** `.env.local`  
  - **Prod:** Google Secret Manager → Cloud Run env vars  
- **🔎 Web Enrichment (optional):** The **LLM worker** can enrich answers with relevant links using **Google Custom Search**.  
  Provide `GOOGLE_CUSTOM_SEARCH_KEY` and `GOOGLE_CUSTOM_SEARCH_CX` (via env or GSM). If absent, enrichment is skipped gracefully.

**Flow**
1. **Middleware** requires login → `/sign-in`  
2. User chooses **role** + **mission**  
3. Role-conditioned prompts hit **gpt-oss**  
4. The worker processes jobs and can augment responses with link previews (CSE)  
5. UI wraps output in safe, adaptive learning UX  

---

## 🔄 Change notice: Online Redis (with local fallback)

We’ve moved to an **online-first Redis** configuration for reliability and to share a single queue between **web** and **worker** on Cloud Run.

- Online connection (recommended): **`REDIS_URL_ONLINE`** (TLS URI, e.g. Upstash)  
- Local fallback (dev): **`REDIS_URL_LOCAL`** (Docker Redis)  
- Optional override: **`FORCE_LOCAL_REDIS=1`** forces local even if online is set

> **Important:** BullMQ/ioredis use a **Redis connection URI** like `rediss://default:<PASSWORD>@host:6379`.  
> **Do not** use Upstash REST tokens/URLs for BullMQ—those are HTTP-only and **not** compatible with the queue.

---

## 📦 Install & Run (Local)

### Prereqs
- Node.js 18+  
- [Ollama](https://ollama.ai) with `gpt-oss:20b` pulled  
- Clerk dev keys  
- **One** Redis option below:
  - **Option A (recommended): Upstash online** — no Docker needed  
  - **Option B: Docker Redis** — run Redis locally

### 1) Environment
```bash
cp .env.example .env.local
```
Minimum you should set for local:
```dotenv
# Clerk (required for login)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# NASA + Ollama
NASA_API_KEY=DEMO_KEY
OLLAMA_BASE_URL=http://127.0.0.1:11434

# Google Custom Search (optional web enrichment)
GOOGLE_CUSTOM_SEARCH_KEY=
GOOGLE_CUSTOM_SEARCH_CX=

# Redis (choose ONE option below)
# Option A: Upstash (online-first)
REDIS_URL_ONLINE=rediss://default:<PASSWORD>@<host>.upstash.io:6379
FORCE_LOCAL_REDIS=0

# Option B: Local Docker (fallback)
# REDIS_URL_LOCAL=redis://127.0.0.1:6379
# FORCE_LOCAL_REDIS=1
```

### 2) Choose ONE Redis setup

#### ✅ Option A — Upstash (recommended)
1. Create a Redis database in Upstash.  
2. Copy the **TLS connection string** (looks like `rediss://default:<PASSWORD>@...:6379`).  
3. Put it in `.env.local` as `REDIS_URL_ONLINE`.  
4. (Optional for prod) Store it in **GCP Secret Manager** as `REDIS_URL_ONLINE`.

**Verify connection:**

redis-cli -u "rediss://default:<PASSWORD>@<host>.upstash.io:6379" --tls PING
# Expect: PONG


> Note: Upstash **REST URL/TOKEN** are **not used** by BullMQ. Only the **TLS URI** above.

#### 🐳 Option B — Local Docker Redis

docker run -d --name stella-redis -p 6379:6379 redis:7-alpine
redis-cli -u redis://127.0.0.1:6379 PING    # Expect: PONG

Then set in `.env.local`:

REDIS_URL_LOCAL=redis://127.0.0.1:6379
FORCE_LOCAL_REDIS=1


### 3) (Optional) GCP auth for local GSM

gcloud auth application-default login


### 4) Install deps & run

npm install
npm run dev       # web (http://localhost:3000)
npm run worker    # background jobs


---

## ☁️ Deploy (Cloud Run)

### 1) Create secrets in GSM (examples)

gcloud secrets create NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --replication-policy=automatic
printf '%s' 'pk_live_...' | gcloud secrets versions add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --data-file=-

gcloud secrets create CLERK_SECRET_KEY --replication-policy=automatic
printf '%s' 'sk_live_...' | gcloud secrets versions add CLERK_SECRET_KEY --data-file=-

gcloud secrets create NASA_API_KEY --replication-policy=automatic
printf '%s' 'your-nasa-key' | gcloud secrets versions add NASA_API_KEY --data-file=-

gcloud secrets create OLLAMA_BASE_URL --replication-policy=automatic
printf '%s' 'https://your-provider-url' | gcloud secrets versions add OLLAMA_BASE_URL --data-file=-

# NEW: Online Redis (connection URI)
gcloud secrets create REDIS_URL_ONLINE --replication-policy=automatic
printf '%s' 'rediss://default:<PASSWORD>@<host>.upstash.io:6379' | gcloud secrets versions add REDIS_URL_ONLINE --data-file=-

# OPTIONAL: Google Custom Search for link enrichment
gcloud secrets create GOOGLE_CUSTOM_SEARCH_KEY --replication-policy=automatic
printf '%s' 'AIza...' | gcloud secrets versions add GOOGLE_CUSTOM_SEARCH_KEY --data-file=-
gcloud secrets create GOOGLE_CUSTOM_SEARCH_CX --replication-policy=automatic
printf '%s' 'your-cse-id' | gcloud secrets versions add GOOGLE_CUSTOM_SEARCH_CX --data-file=-

---

### 2) Build & Deploy via **Cloud Build**

This project includes **two Cloud Build configs**:

- `cloudbuild.web.yaml` → builds and deploys the **Next.js web frontend**  
- `cloudbuild.worker.yaml` → builds and deploys the **BullMQ worker**  

From the project root (or inside `frontend/` if that’s where the Dockerfiles live):


# Deploy web
gcloud builds submit --config cloudbuild.web.yaml .

# Deploy worker
gcloud builds submit --config cloudbuild.worker.yaml .

---

## 🎥 Demo script (for your video)
1. Log in as a judge (use credentials above).  
2. Show role picker (Explorer → Cadet → Scholar).  
3. Launch **Rocket Lab** mission → complete task.  
4. Switch role mid-demo → same mission adapts output.  
5. Show **Earth Observer** mission with a quick query.  
6. End with **Space Poster** mission → Stella writes a poem.  
*(Keep it <3 minutes; highlight impact + offline capability)*

---

## ✅ Hackathon requirements checklist
- Built with **gpt-oss** models ✔  
- Live demo ✔  
- Public repo + README with install/test instructions ✔  
- Video < 3 mins ✔  
- Categories: **Best Overall**, **For Humanity**, (optional) **Best Local Agent** ✔  
- Clear IP ownership, OSS-friendly license ✔  
- Judge credentials provided ✔  

---

## 🧰 Troubleshooting

- **500 on job polling**: ensure both **web** and **worker** point at the same `REDIS_URL_ONLINE` and the same `LLM_QUEUE_NAME`.  
- **Upstash “I/O error / ECONNRESET”**: verify the URI is TLS (`rediss://`), port `6379`, and credentials are correct. Test with:
  ```bash
  redis-cli -u "rediss://default:<PASSWORD>@<host>.upstash.io:6379" --tls PING
  ```
- **Docker Redis not found**: run `docker ps` to confirm the container is running, and check port `6379` isn’t blocked.  
- **REST tokens**: Upstash REST (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are **not used** by BullMQ/ioredis. Only the **TLS connection URI** works for the queue.  
- **CSE enrichment not working**: confirm `GOOGLE_CUSTOM_SEARCH_KEY` and `GOOGLE_CUSTOM_SEARCH_CX` are set (env or GSM). The worker will skip enrichment if they’re missing.

---

## 📜 License
[Apache 2.0](LICENSE) or [MIT](LICENSE) (choose one and add file).  
NASA images used are public domain.

---

## 🙏 Acknowledgements
- OpenAI for **gpt-oss**  
- NASA for APOD images  
- Clerk for auth  
- GSAP for animations
