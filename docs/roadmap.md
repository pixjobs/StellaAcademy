# Stella Academy - Plan for Conversion to Explorer Tool

**Created**: 2026-07-07
**Status**: Draft
**Goal**: Convert Stella Academy from AI-powered mission platform to general exploratory tool for space content and imagery.

## Current State Assessment

### What Works
- Frontend framework (Next.js 15.5.2) - functional
- Clerk authentication (judge@stella-academy.org / StellaRocks2025!)
- Basic role-based structure (Explorer/Cadet/Scholar)
- NASA APOD integration permitted (NASA_API_KEY in GSM)

### What's Broken/Obsolete
- ❌ Ollama/gpt-oss worker not set up - no AI functionality
- ❌ Cloud Tasks queues - not configured for production
- ❌ 33 outdated packages - security vulnerabilities identified
- ❌ react-three, gsap, katex - expensive libraries for simple content display
- ❌ AuthService, AI Worker routes - unused since AI is offline

### Dependencies to Remove
- @react-three/drei, @react-three/fiber - no longer used for 3D
- @gsap/react, gsap - no animation framework needed
- katex, react-katex - no longer need math rendering
- bullmq - Redis/queue system not needed for static content
- @google-cloud/tasks - Cloud Tasks not used for simple site
- @google-cloud/firestore - replace with simple JSON on GCS or no persistence

---

## New Features & Direction

### Core Concept
**Stella Academy** becomes a curated space knowledge portal with:
- Beautiful space imagery (NASA APOD, ESA, SpaceX)
- Educational content organized by role (Explorer/Cadet/Scholar)
- Interactive space facts, not interactive AI
- Better visuals for space enthusiasts

### Role-Based Content Structure

#### Explorer (Kids) "Space Explorer"
- Simple language, fun astronomy facts
- Visual-heavy with large imagery
- Topics: Planets, Moon, Stars, Solar System overview
- Format: Large cards, simple text, colorful icons

#### Cadet (Teens) "Space Researcher"
- More detailed information with categories
- Timeline of space exploration history
- Topics: Classic missions, current ISS, Mars missions
- Format: structured articles, photo galleries

#### Scholar (Uni) "Deep Space Analyst"
- Advanced topics, peer-reviewed-like content
- Astrophysics concepts, x-ray astronomy, black holes
- Topics: Review papers, technical deep-dives
- Format: academic-style articles, references

### Proposed Features

#### 1. NASA Gallery (Primary Feature)
- Auto-fetched APOD photos with captions
- Gallery of NASA images categorized by topic
- Dark mode optimized gallery interface

#### 2. Space Facts Engine
- Pre-written curated facts (no AI generation)
- Categories: Planets, Moons, Stars, Nebulae, Spacecraft
- Searchable database
- Format: Card-based with fun facts

#### 3. Interactive Mission Simulators (No AI)
- Guided scenarios users can follow step-by-step
- Fill-in-the-blank or explanation-based
- Example: "Mission Control Scenario" - user inputs decisions
- No LLM involvement - direct content paths

#### 4. Community Highlights
- Featured space images (user-submitted or curated)
- Quote of the day from astronauts/researchers
- Educational resources section

---

## Technical Implementation Plan

### Phase 1: Cleanup & Stabilize (Week 1)
**Goal**: Get clean, working frontend without security issues

1. **Remove unused dependencies**
   ```bash
   npm uninstall @react-three/drei @react-three/fiber @gsap/react
   npm uninstall katex react-katex bullmq client-only server-only
   npm uninstall @google-cloud/tasks @google-cloud/firestore @google-cloud/secret-manager
   ```

2. **Update Next.js and dependencies**
   - Fix @clerk/nextjs >= 7.x requirements
   - Upgrade to Next.js 15.x or 16.x (available version)
   - Address CVE-2025-66478 security fix

3. **Create new content structure**
   - Create `src/data/` directory
   - Prepare static JSON content for missions/facts
   - Update globals.css for dark theme gallery

4. **Verify auth still works**
   - Test Clerk login for judge@stella-academy.org
   - Ensure authentication flow works without changes

### Phase 2: Replace AI Features (Week 2)
**Goal**: Remove all AI-dependent code

1. **Delete AI-related files**
   - Remove `src/lib/ai/` directory
   - Remove `src/workers/ollama/` directory
   - Remove `src/app/api/ai/route.ts` 
   - Remove `src/app/api/llm/route.ts`

2. **Replace endpoints**
   - Standalone pages instead of AI-generated content
   - Client-side image fetching via NASA API

3. **Update main navigation**
   - Remove "Mison Assistant" UI components
   - Replace with "Browse Missions" and "Space Gallery"

4. **Simplify dashboards**
   - No need for complex dashboard with role-adaptive AI
   - Simple tabbed interface instead

### Phase 3: Build New Content Engine (Week 2-3)
**Goal**: Pre-populated space content

1. **Create content database**
   - `src/data/missions/index.ts` - structured missions
   - `src/data/facts/index.ts` - curated space facts
   - `src/data/nasa.ts` - NASA API integration

2. **Build galleries**
   - APOD image gallery component
   - Searchable mission cards
   - Category filtering (Explorer/Cadet/Scholar)

3. **Implement role-based content routing**
   - Middleware or route groups to show content appropriate to role
   - YAML or JSON configuration for role:content mapping

### Phase 4: Polish & Deploy (Week 3-4)
**Goal**: Live, beautiful exploratory site

1. **UI/UX improvements**
   - Dark mode gallery (space-themed)
   - Large imagery display
   - Smooth animations (CSS transitions instead of GSAP)

2. **SEO improvements**
   - Add metadata for pages
   - Schema.org for mission content
   - Open graph images

3. **Performance**
   - Add Next.js optimizations
   - Image optimization for NASA photos
   - Caching strategy for gallery

---

## File Changes Summary

### Files to ADD
- `src/data/missions/*.ts` - Pre-written missions
- `src/data/facts/*.ts` - Space facts
- `src/lib/nasa.ts` - NASA API client
- `src/components/Gallery.tsx` - Image gallery component
- `src/components/FactCard.tsx` - Space fact display
- `docs/roadmap.md` - This plan
- `docs/REMOVE_AI_FEATURES.md` - Detailed changes

### Files to DELETE
- `src/app/api/ai/route.ts`
- `src/app/api/llm/route.ts`
- `src/workers/ollama/` - entire directory
- `src/lib/ai/` - entire directory (except any useful helpers)
- `src/lib/cloudTasks.ts` - unused
- `src/lib/secrets.ts` - simplify to using env vars directly

### Files to MODIFY
- `package.json` - remove old dependencies
- `next.config.js` - simplify if needed
- `tailwind.config.js` - remove GSAP imports
- `src/app/layout.tsx` - remove AI-related components
- `src/app/page.tsx` - replace with gallery/index layout
- `src/app/dashboard/page.tsx` - simplify or remove
- `src/lib/auth.ts` - simplify clerk usage

---

## Google Cloud Resources to Keep/Remove

### What to KEEP
- Clerk authentication (still useful for users/judges)
- Google Secret Manager (for NASA_API_KEY and other keys if needed)

### What to REMOVE
- Cloud Tasks queues (not needed for simple site)
- Cloud Run worker services (no longer needed without AI)
- Cloud Run stella-worker deployment (delete from Cloud Console)
- Cloud build configs for worker (keep web config for deployment)

### What to RETIRE/Create
- Create new Cloud Storage bucket for NASA image storage
- Remove IAM bindings for worker SA (won't need it)
- Simplify IAM bindings to just OAuth/Clerk users

---

## Deprecation Schedule

### Week 1: � Notify users
- Twitter/Devpost post: "Stella Academy getting a facelift - from AI missions to curated space exploration"
- Add notice on current site: "Coming soon!"

### Week 2: � Rebrand overlay
- Show "Stella Academy: Space Explorer" as rebrand
- Keep judge@stella-academy.org credentials

### Week 3: � Launch new version
- Migrate judge users to new system
- Add new features gradually

---

## Success Criteria

✅ All security vulnerabilities resolved (next@16.x, update glob)
✅ Clean dependency tree (60-70% fewer dependencies)
✅ Judge credentials still work
✅ Gallery loads NASA APOD images
✅ Role-based content works as expected
✅ No npm warnings or errors
✅ Response time improved (removing react-three, gsap)
✅ Site loads in <2s vs current version

---

## Questions to Answer

1. **Should we keep curator mode** with NASA API integration?
2. **How detailed should the content be** - 1-2 lines per fact, or full articles?
3. **Should we keep judge credentials** or migrate to new admin system?
4. **Do we need user registration** or keep anonymous access?
5. **Medium for content updates** - GitHub PR process vs admin panel?

## Recommended Actions Now

1. **Run dependency cleanup** to remove unused packages
2. **Check security vulnerabilities** in remaining deps
3. **Write 100 space facts and 10 missions** for initial launch
4. **Build NASA APOD gallery** component
5. **Remove all AI paths** from routing structure
6. **Update Clerk configuration** for new domain/port structure
7. **Deploy test version** to Cloud Run for review

---

## Next Steps

1. Cleanup developer's environment - remove unused node_modules pattern from current state
2. Write initial content (facts, missions) for the first release
3. Build the gallery component and navbar replacements
4. Cut test site to user review
5. Plan phased re-launch to avoid confusion
