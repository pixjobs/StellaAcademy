# ✨ Stella Academy
**Personalised space-learning missions powered by open models (gpt-oss)**

---

## 📺 Demo & Links
- **Live demo:** <https://stella-academy.org>  
- **Source code:** <https://github.com/pixjobs/StellaAcademy>  
- **Devpost project page:** <https://devpost.com/software/stella-academy>

### Judge Login (pre-configured in Clerk)
We created a dedicated **test user in Clerk** so judges can log in without signing up:

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
- **Rocket Lab:** identify rocket parts, decide launch readiness, detect anomalies  
- **Earth Observer:** find continents, explain storm systems, analyse seasonal cloud patterns  
- **Space Poster:** poems for kids, captions for teens, abstracts for scholars  

---

## 🌍 Why it matters
- **For Humanity:** lowers barriers to STEM education with playful, adaptive AI.  
- **Impact:** the framework can even run **fully offline with gpt-oss via Ollama**, making it usable in classrooms, rural areas, or disaster relief contexts.  
- **Generalisation:** the same role/mission structure applies beyond space (biology, climate, history).  

---

## ✨ What makes it novel
- **Role-conditioned prompts**: same model, different pedagogy per learner.  
- **Mission scaffolding**: bite-sized steps keep the AI focused, safe, and engaging.  
- **Local-first option**: runs on `gpt-oss:20b` via Ollama — no cloud needed if installed locally.  
- **Safe by design**: kid/teen/uni guardrails, UI hints, and no dark patterns.  

---

## 🛠️ How it works
- **Frontend:** Next.js (App Router) + GSAP animations  
- **Auth:** Clerk (middleware-gated; `/sign-in/[[...rest]]`)  
- **Models:** gpt-oss via Ollama (local) or cloud provider  
- **Background:** NASA APOD for dynamic space backdrops  
- **Queue/Jobs:** Redis + BullMQ worker for background tasks  

**Flow**
1. Middleware requires login → `/sign-in`  
2. User chooses **role** + **mission**  
3. Role-conditioned prompts hit **gpt-oss**  
4. Worker processes jobs (optionally enriches with web links)  
5. UI wraps everything in an adaptive learning UX  

---

## 🎥 Demo script
1. Log in as judge (use credentials above).  
2. Show role picker (Explorer → Cadet → Scholar).  
3. Run **Rocket Lab** mission.  
4. Switch role mid-demo → same mission adapts output.  
5. Show **Earth Observer** with a quick query.  
6. Finish with **Space Poster** → Stella writes a poem.  

*(Keep it under 3 minutes; highlight impact + offline capability)*

---

## ✅ Hackathon checklist
- Built with **gpt-oss** ✔  
- Live demo ✔  
- Public repo ✔  
- Video (<3 mins) ✔  
- Judge credentials ✔  
- OSS-friendly license ✔  

---

## 📜 License
[Apache 2.0](LICENSE) or [MIT](LICENSE).  
NASA images are public domain.  

---

## 🙏 Acknowledgements
- OpenAI for **gpt-oss**  
- NASA for APOD images  
- Clerk for auth  
- GSAP for animations
