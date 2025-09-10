# 🚀 Deployment & Testing Guide (Cloud Run + Local)

This project is productionised for **Google Cloud Run** with **Cloud Build**.  
Two services are deployed:  

- **stella-web** → Next.js frontend  
- **stella-worker** → BullMQ job processor  

---

## 1. Secrets setup

Use **Google Secret Manager (GSM)** to store credentials:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Clerk public key, required)  
- `CLERK_SECRET_KEY` (Clerk secret key, required)  
- `NASA_API_KEY` (for NASA APOD)  
- `OLLAMA_BASE_URL` (for LLM provider or local Ollama)  
- `REDIS_URL_ONLINE` (Upstash TLS URI)  
- *(optional)* `GOOGLE_CUSTOM_SEARCH_KEY` + `GOOGLE_CUSTOM_SEARCH_CX`

---

## 2. Cloud Build configs

- `cloudbuild.web.yaml` → builds and deploys **stella-web**  
- `cloudbuild.worker.yaml` → builds and deploys **stella-worker**

Submit from repo root:


gcloud builds submit --config cloudbuild.web.yaml .
gcloud builds submit --config cloudbuild.worker.yaml .


---

## 3. Quirks & gotchas

- Clerk requires **both** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_PUBLISHABLE_KEY`.  
- In production we mapped them to the same secret for reliability.  
- If secrets are missing, middleware runs in “Clerk disabled” mode.  
- Cloud Run sometimes caches old secrets — redeploy to force refresh.  
- `.dockerignore` and `.gcloudignore` must exclude heavy files (`node_modules`, `.next`) or builds will bloat to gigabytes.  
- Domain mapping (`www.stella-academy.org`) is handled in Cloud Run custom domains.  

---

## 4. Worker notes

- Worker runs headless (no public URL).  
- Connected to the same Redis queue as web.  
- Controlled via env var `LLM_QUEUE_NAME`.

---

## 5. Local development & testing

You can run the app locally in two modes:

### **Mode 1: Fully Local Setup (Recommended)**  
This mode is isolated from cloud services.  
- Copy `.env.example` → `.env.local`.  
- Fill in Clerk API keys.  
- Start a local Redis container:  
 
  docker run --name local-redis -p 6379:6379 -d redis

- Ensure `.env.local` includes:  

  REDIS_URL="redis://localhost:6379"

- Run in two terminals:  

  # Terminal 1
  npm run dev   # web
  # Terminal 2
  npm run worker   # jobs


### **Mode 2: Hybrid Setup (Cloud-Connected)**  
This runs locally but connects to **cloud Redis (Upstash)** and **Google Secret Manager**.  
- Authenticate with Google Cloud:  

  gcloud auth application-default login

- In `.env.local`:  
  - Set Clerk keys.  
  - **Do not** set `REDIS_URL`.  
  - The app will fetch `REDIS_URL_ONLINE` from GSM automatically.  
- Run as in Mode 1.  

⚠️ **Warning**: In this mode your local code interacts with **live cloud resources** (production-like). Use carefully.
