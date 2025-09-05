# ✨ Stella Academy
**Personalised space-learning missions powered by open models (gpt-oss)**

---

## 📺 Demo & Links
- **Live demo:** <https://stella-academy.org>
- **Demo video (≤3 mins):** <https://youtu.be/YOUR-VIDEO>
- **Source code:** <https://github.com/your-org/stella-academy>
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

Flow:
1. **Middleware** requires login → `/sign-in`  
2. User chooses **role** + **mission**  
3. Role-conditioned prompts hit **gpt-oss**  
4. UI wraps output in safe, adaptive learning UX  

---

## 📦 Install & Run (Local)

### Prereqs
- Node.js 18+  
- Docker (for Redis)  
- [Ollama](https://ollama.ai) with `gpt-oss:20b` pulled  
- Clerk dev keys  

### Setup
```bash
# 1. Clone
git clone https://github.com/your-org/stella-academy
cd stella-academy

# 2. Env
cp .env.example .env.local
# Fill at minimum:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...
# NASA_API_KEY=DEMO_KEY
# OLLAMA_BASE_URL=http://127.0.0.1:11434
# REDIS_URL=redis://127.0.0.1:6379

# 3. Start Redis
docker run -d --name stella-redis -p 6379:6379 redis:7-alpine
redis-cli -u redis://127.0.0.1:6379 PING  # should return PONG

# 4. Login for secrets (optional if you want GSM locally)
gcloud auth application-default login

# 5. Install deps
npm install

# 6. Run web + worker
npm run dev       # web (http://localhost:3000)
npm run worker    # background jobs
```

---

## ☁️ Deploy (Cloud Run)

1. **Create secrets in GSM**
```bash
gcloud secrets create NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --replication-policy=automatic
printf '%s' 'pk_live_...' | gcloud secrets versions add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --data-file=-

gcloud secrets create CLERK_SECRET_KEY --replication-policy=automatic
printf '%s' 'sk_live_...' | gcloud secrets versions add CLERK_SECRET_KEY --data-file=-

gcloud secrets create NASA_API_KEY --replication-policy=automatic
printf '%s' 'your-nasa-key' | gcloud secrets versions add NASA_API_KEY --data-file=-

gcloud secrets create OLLAMA_BASE_URL --replication-policy=automatic
printf '%s' 'https://your-provider-url' | gcloud secrets versions add OLLAMA_BASE_URL --data-file=-
```

2. **Deploy web**
```bash
gcloud run deploy stella-web   --image=gcr.io/PROJECT/IMAGE:TAG   --region=europe-west1   --allow-unauthenticated   --set-secrets=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:latest   --set-secrets=CLERK_SECRET_KEY=CLERK_SECRET_KEY:latest   --set-secrets=NASA_API_KEY=NASA_API_KEY:latest   --set-secrets=OLLAMA_BASE_URL=OLLAMA_BASE_URL:latest   --update-env-vars=REDIS_URL=redis://your-redis:6379,LLM_QUEUE_NAME=llm-queue,NODE_ENV=production
```

3. **Deploy worker** (as Run Job or long-running service)
```bash
gcloud run deploy stella-worker   --image=gcr.io/PROJECT/IMAGE:TAG   --region=europe-west1   --no-allow-unauthenticated   --set-env-vars=REDIS_URL=redis://your-redis:6379,LLM_QUEUE_NAME=llm-queue,NODE_ENV=production
```

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

## 📜 License
[Apache 2.0](LICENSE) or [MIT](LICENSE) (choose one and add file).  
NASA images used are public domain.

---

## 🙏 Acknowledgements
- OpenAI for **gpt-oss**  
- NASA for APOD images  
- Clerk for auth  
- GSAP for animations  

---
