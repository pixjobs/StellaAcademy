// src/lib/nasa.ts
import { getNasaApiKey } from '@/lib/secrets';
// --- THIS IS THE FIX (PART 1) ---
// 1. Import the canonical, detailed MarsPhoto type.
import type { MarsPhoto } from '@/types/llm';

/* ─────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */
export type Role = 'explorer' | 'cadet' | 'scholar';

export type Apod = {
  date: string;
  title: string;
  explanation: string;
  mediaType: string;
  bgUrl: string | null;
  credit: string;
};

export type NivlItem = {
  nasaId: string;
  title: string;
  description?: string;
  date?: string;
  keywords: string[];
  href: string | null; // image URL (thumb/medium/orig)
};

// 2. The local, incorrect MarsPhoto type has been removed.

/* ─────────────────────────────────────────────────────────
   Config
────────────────────────────────────────────────────────── */
const REVALIDATE_DAY = 60 * 60 * 24;
const REVALIDATE_HOUR = 60 * 60;
const TIMEOUT_MS = Number(process.env.NASA_TIMEOUT_MS || 15_000);
const DEBUG = process.env.DEBUG_NASA === '1';

const HTTPS_UPGRADE_HOSTS = new Set([
  'apod.nasa.gov',
  'images-assets.nasa.gov',
  'images.nasa.gov',
  'mars.nasa.gov',
]);

/* ─────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
function log(...args: any[]) {
  if (DEBUG) console.log('[nasa]', ...args);
}
function warn(...args: any[]) {
  console.warn('[nasa]', ...args);
}

async function timeoutFetch(url: string, init: RequestInit = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function upgradeHttps(u: string | null | undefined) {
  if (!u) return u ?? null;
  try {
    const url = new URL(u);
    if (url.protocol === 'http:' && HTTPS_UPGRADE_HOSTS.has(url.hostname)) {
      url.protocol = 'https:';
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

async function headReachable(url: string) {
  try {
    const r = await timeoutFetch(url, { method: 'HEAD' }, 7_000);
    return r.ok;
  } catch {
    return false;
  }
}

function largestByNameGuess(list: string[]) {
  // crude heuristic: prefer names containing “large/orig” or bigger resolution-like tokens
  const score = (s: string) => {
    let sc = 0;
    if (/_orig|_large|_full|_hi|_2048|_4096/i.test(s)) sc += 3;
    const m = s.match(/(\d{3,5})[^\d]+(\d{3,5})/); // e.g., 2048x1536
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      sc += Math.max(a, b) / 1000;
    }
    return sc;
  };
  return list.sort((a, b) => score(b) - score(a))[0];
}

/* ─────────────────────────────────────────────────────────
   APOD (Astronomy Picture of the Day)
────────────────────────────────────────────────────────── */
export async function fetchAPOD(opts?: {
  date?: string; // YYYY-MM-DD
  preferHD?: boolean; // default true
}): Promise<Apod> {
  const preferHD = opts?.preferHD ?? true;

  // key fallback: real secret → DEMO_KEY
  let key: string;
  try {
    key = await getNasaApiKey();
  } catch {
    key = 'DEMO_KEY';
    warn('APOD: using DEMO_KEY fallback');
  }

  const params = new URLSearchParams({ api_key: key, thumbs: 'true' });
  if (opts?.date) params.set('date', opts.date);
  const url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;

  log('APOD GET', url);
  const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_DAY } }, TIMEOUT_MS);
  if (!r.ok) {
    warn('APOD HTTP', r.status);
    return {
      date: opts?.date || 'local',
      title: 'Stella Academy – Space',
      explanation: 'APOD unavailable. Showing fallback.',
      mediaType: 'image',
      bgUrl: null,
      credit: 'NASA/APOD',
    };
  }

  const apod = await r.json();
  const media = String(apod.media_type || '');
  let bgUrl: string | null = null;

  if (media === 'image') {
    bgUrl = preferHD ? apod.hdurl || apod.url : apod.url || apod.hdurl;
  } else if (media === 'video') {
    // Use NASA-provided thumbnail when available
    bgUrl = apod.thumbnail_url || null;
  }

  bgUrl = upgradeHttps(bgUrl);
  if (bgUrl && !(await headReachable(bgUrl))) {
    // fallback to the other APOD URL field if first failed
    const alt = bgUrl === apod.hdurl ? apod.url : apod.hdurl;
    const alt2 = upgradeHttps(alt || apod.thumbnail_url || null);
    if (alt2 && (await headReachable(alt2))) bgUrl = alt2;
    else bgUrl = null;
  }

  return {
    date: apod.date,
    title: apod.title,
    explanation: apod.explanation,
    mediaType: media,
    bgUrl,
    credit: apod.copyright || 'NASA/APOD',
  };
}

/* ─────────────────────────────────────────────────────────
   NASA Image & Video Library (search)
   Optional asset expansion to get the "best" JPEG.
────────────────────────────────────────────────────────── */
export async function searchNIVL(
  q: string,
  opts?: { page?: number; limit?: number; expandAssets?: boolean; prefer?: 'orig' | 'large' | 'any' }
): Promise<NivlItem[]> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 18;
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page=${page}`;

  log('NIVL search', { q, page, url });
  const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_HOUR } });
  if (!r.ok) {
    warn('NIVL HTTP', r.status);
    return [];
  }

  const j = await r.json();
  const raw: NivlItem[] = (j.collection?.items || [])
    .slice(0, limit)
    .map((it: any) => {
      const data = it.data?.[0] || {};
      const link = it.links?.find((l: any) => l.render === 'image') || it.links?.[0] || null;
      return {
        nasaId: data.nasa_id,
        title: data.title,
        description: data.description,
        date: data.date_created,
        keywords: data.keywords || [],
        href: upgradeHttps(link?.href || null),
      };
    });

  if (!opts?.expandAssets) return raw;

  // Expand assets for the items to pick the best JPEG/PNG
  const expanded = await Promise.allSettled(
    raw.map(async (it) => {
      if (!it.nasaId) return it;
      const best = await pickBestNivlAsset(it.nasaId, opts?.prefer);
      return { ...it, href: best || it.href };
    })
  );

  return expanded.map((p, i) => (p.status === 'fulfilled' ? p.value : raw[i]));
}

async function pickBestNivlAsset(nasaId: string, prefer: 'orig' | 'large' | 'any' = 'orig') {
  try {
    const url = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;
    const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_HOUR } }, 12_000);
    if (!r.ok) {
      warn('NIVL asset HTTP', r.status, nasaId);
      return null;
    }
    const j = await r.json();
    const items: { href: string }[] = j.collection?.items || [];
    if (!items.length) return null;

    const hrefs = items.map((x) => upgradeHttps(x.href)).filter(Boolean) as string[];
    const jpgs = hrefs.filter((h) => /\.jpe?g($|\?)/i.test(h));
    const pngs = hrefs.filter((h) => /\.png($|\?)/i.test(h));

    let pick: string | null = null;
    if (prefer === 'orig') {
      pick =
        jpgs.find((h) => /_orig\.jpe?g/i.test(h)) ||
        largestByNameGuess(jpgs) ||
        largestByNameGuess(pngs) ||
        hrefs[0] ||
        null;
    } else if (prefer === 'large') {
      pick = largestByNameGuess(jpgs) || largestByNameGuess(pngs) || hrefs[0] || null;
    } else {
      pick = jpgs[0] || pngs[0] || hrefs[0] || null;
    }

    if (pick && (await headReachable(pick))) return pick;
    // Fallback: first reachable
    for (const h of [...jpgs, ...pngs, ...hrefs]) {
      if (await headReachable(h)) return h;
    }
    return pick;
  } catch (e) {
    warn('NIVL asset error', String(e));
    return null;
  }
}

/* ─────────────────────────────────────────────────────────
   Mars Rover Photos with camera fallback
────────────────────────────────────────────────────────── */
// --- THIS IS THE FIX (PART 2) ---
// 3. The function signature now promises to return the canonical MarsPhoto[] type.
export async function fetchMarsPhotos(opts?: {
  rover?: 'curiosity' | 'perseverance' | 'opportunity' | 'spirit';
  sol?: number;
  camera?: string; // 'navcam','fhaz','rhaz','mast','chemcam'...
  page?: number;
}): Promise<MarsPhoto[]> {
  const rover = opts?.rover ?? 'curiosity';
  const sol = opts?.sol ?? 1000;
  const page = opts?.page ?? 1;
  const preferredCamera = opts?.camera ?? 'navcam';

  let key: string;
  try {
    key = await getNasaApiKey();
  } catch {
    key = 'DEMO_KEY';
    warn('Mars: using DEMO_KEY fallback');
  }

  const camerasTry = [preferredCamera, 'fhaz', 'rhaz', 'mast', 'chemcam', 'navcam'];
  for (const cam of camerasTry) {
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&camera=${encodeURIComponent(
      cam
    )}&page=${page}&api_key=${encodeURIComponent(key)}`;

    log('Mars GET', { rover, sol, cam, url });
    const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_HOUR } });
    if (!r.ok) {
      warn('Mars HTTP', r.status, cam);
      continue;
    }
    const j = await r.json();
    const photos = (j.photos || []) as any[];
    if (photos.length) {
      // 4. The returned object now perfectly matches the imported MarsPhoto type.
      return photos.map((p) => ({
        id: p.id,
        sol: p.sol,
        camera: p.camera, // Pass the whole camera object
        img_src: upgradeHttps(p.img_src) || p.img_src,
        earth_date: p.earth_date,
        rover: p.rover, // Pass the whole rover object
      }));
    }
  }

  warn('Mars: no photos found across fallback cameras');
  return [];
}

/* ─────────────────────────────────────────────────────────
   Context builders (feed Stella succinct info)
────────────────────────────────────────────────────────── */
export function buildContextFromNIVL(items: NivlItem[], limit = 8): string {
  return items
    .slice(0, limit)
    .map((im, i) => `#${i + 1} ${im.title || 'Untitled'} – ${im.href ?? ''}`)
    .join('\n');
}

// --- THIS IS THE FIX (PART 3) ---
// 5. This function is updated to work with the nested structure of the correct MarsPhoto type.
export function buildContextFromMars(items: MarsPhoto[], limit = 8): string {
  return items
    .slice(0, limit)
    .map((p, i) => `#${i + 1} ${p.rover.name} • ${p.camera.name} (${p.earth_date}) – ${p.img_src}`)
    .join('\n');
}

/* ─────────────────────────────────────────────────────────
   Ollama (server-side direct call)
   - Use this if you want to generate server-side content.
   - For client streaming, keep using /api/ask (already added).
────────────────────────────────────────────────────────── */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60_000);

function ollamaAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (process.env.OLLAMA_BEARER_TOKEN) {
    h.Authorization = `Bearer ${process.env.OLLAMA_BEARER_TOKEN}`;
  } else if (process.env.OLLAMA_BASIC_AUTH) {
    const b64 = Buffer.from(process.env.OLLAMA_BASIC_AUTH).toString('base64');
    h.Authorization = `Basic ${b64}`;
  }
  return h;
}

export async function askOllama(params: {
  prompt: string;
  role?: Role;
  mission?: string;
  context?: string;
  temperature?: number;
  top_p?: number;
}): Promise<string> {
  const { prompt, role = 'explorer', mission = 'general', context, temperature = 0.6, top_p = 0.9 } = params;

  if (!OLLAMA_BASE_URL) {
    console.error('[Ollama] OLLAMA_BASE_URL is not set. Aborting request.');
    throw new Error('Ollama base URL is not configured.');
  }

  const system = [
    `You are Stella, a friendly space tutor in a pixel-art learning game.`,
    `Adapt difficulty to the role:`,
    `- explorer: simple words, 1–2 tiny steps, no heavy math.`,
    `- cadet: GCSE level, show equations and worked steps.`,
    `- scholar: university level, formal reasoning and concise derivations.`,
    `Use provided context if relevant. Keep outputs short and actionable.`,
    `Mission: ${mission}.`,
  ].join('\n');

  const userMessage = context ? `Context:\n${context}\n\nQuestion:\n${prompt}` : prompt;

  const payload = {
    model: OLLAMA_MODEL,
    stream: false,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Role: ${role}` },
      { role: 'user', content: userMessage },
    ],
    options: { temperature, top_p },
  };

  try {
    console.log(`[Ollama] POST ${OLLAMA_BASE_URL}/api/chat (model ${OLLAMA_MODEL})`);
    DEBUG && console.log('[Ollama] Payload:', JSON.stringify(payload, null, 2));

    const r = await timeoutFetch(
      `${OLLAMA_BASE_URL}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ollamaAuthHeaders() },
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
      OLLAMA_TIMEOUT_MS
    );

    if (!r.ok) {
      const errorBody = await r.text().catch(() => 'Could not read error body.');
      console.error(`[Ollama] ${r.status} ${r.statusText}`);
      console.error('[Ollama] Error Body:', errorBody);
      throw new Error(`Ollama API responded with status ${r.status}: ${errorBody || r.statusText}`);
    }

    const data = await r.json();
    DEBUG && console.log('[Ollama] Response data:', JSON.stringify(data, null, 2));

    const content = data?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      console.warn('[Ollama] Empty/invalid content.');
      return '';
    }
    return content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[Ollama] Request timed out after ${OLLAMA_TIMEOUT_MS / 1000}s.`);
      throw new Error('The request to Ollama timed out.');
    }
    console.error('[Ollama] Unexpected error:', error?.message || error);
    if (String(error?.message || '').includes('ECONNREFUSED')) {
      console.error(`[Ollama] Connection refused. Is Ollama running at ${OLLAMA_BASE_URL}?`);
    }
    throw error;
  }
}

/* ─────────────────────────────────────────────────────────
   Handy prompt templates (optional)
────────────────────────────────────────────────────────── */
export const prompts = {
  rocketChecklist: (role: Role) =>
    `Make a simple ${role}-friendly 3-step rocket launch checklist. Use short lines.`,
  roverOneQuestion: (index = 1, role: Role = 'explorer') =>
    `Create one ${role}-friendly question about image #${index}, then give the answer.`,
  posterCaption: (role: Role = 'explorer') =>
    `Write a ${role}-friendly 2-line poster caption. Line 1: catchy title. Line 2: one fact.`,
};