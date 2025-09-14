/* eslint-disable no-console */

/**
 * @file roverCam.ts
 * Hardened RoverCam:
 * - Works with either fetchLatestMarsPhotos(rover) or (rover, apiKey, limit, opts)
 * - Retries Mars API calls; upgrades http->https on known NASA hosts
 * - Dedupes by href, caps per camera via env (ROVER_CAM_MAX_PER_CAMERA)
 * - Requires a minimum total image count (ROVER_CAM_MIN_TOTAL); else returns educational fallback
 * - Logs unknown camera codes encountered for future mapping
 */

import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic, Img, MarsPhoto } from '@/types/mission';
import { ensureMissionPlan, ensureTopic, retry, logger, getApiKey } from '../shared/core';
// The Mars client is exported from the apis barrel file.
import { fetchLatestMarsPhotos } from '../../apis';

// ---------- tiny env helpers ----------
function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const MAX_PER_CAMERA = intEnv('ROVER_CAM_MAX_PER_CAMERA', 10);
const MIN_TOTAL = intEnv('ROVER_CAM_MIN_TOTAL', 6);
const MARS_ATTEMPTS = intEnv('ROVER_CAM_MARS_ATTEMPTS', 2);
const MARS_LIMIT_HINT = intEnv('ROVER_CAM_MARS_LIMIT_HINT', 50);

// ---------- utils ----------
function upgradeHttps(u: string | null | undefined): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    if (url.protocol === 'http:' && /(^|\.)nasa\.gov$/i.test(url.hostname)) {
      url.protocol = 'https:';
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

function isMarsPhotoArray(x: unknown): x is MarsPhoto[] {
  return Array.isArray(x) && x.every((p) => {
    if (typeof p !== 'object' || p === null) return false;
    const ph = p as Partial<MarsPhoto>;
    return (
      typeof ph.img_src === 'string' &&
      typeof ph.earth_date === 'string' &&
      typeof ph.id !== 'undefined' &&
      ph.camera && typeof ph.camera === 'object' &&
      typeof (ph.camera as any).name === 'string'
    );
  });
}

/**
 * Accepts both client shapes:
 *   fetchLatestMarsPhotos(rover)
 *   fetchLatestMarsPhotos(rover, apiKey, limit, opts)
 */
async function getLatest(rover: 'curiosity' | string, apiKey: string | null): Promise<MarsPhoto[]> {
  // try newer signature first if apiKey is present
  if (apiKey && apiKey.trim()) {
    try {
      // @ts-expect-error – some builds accept (rover, apiKey, limit, opts)
      return await fetchLatestMarsPhotos(rover, apiKey, MARS_LIMIT_HINT, { fallbackToCuriosity: false });
    } catch (e) {
      logger.debug('[RoverCam] extended signature failed; falling back to simple call', { error: e });
    }
  }
  // fallback to classic signature
  // @ts-expect-error – some builds accept only (rover)
  return await fetchLatestMarsPhotos(rover);
}

// ---------- camera metadata (Curiosity) ----------
const cameraInfo: Record<string, { name: string; desc: string }> = {
  FHAZ:    { name: 'Front Hazard Camera (FHAZ)',   desc: 'Low-set views to spot rocks and slopes in the rover’s path.' },
  RHAZ:    { name: 'Rear Hazard Camera (RHAZ)',    desc: 'Rearward hazard views to help avoid getting stuck.' },
  MAST:    { name: 'Mast Camera (MAST)',           desc: 'Color imaging and panoramas from the rover’s “head.”' },
  CHEMCAM: { name: 'Chemistry & Camera (ChemCam)', desc: 'Laser zaps rocks; spectrometer reads the glow for composition.' },
  NAVCAM:  { name: 'Navigation Camera (NAVCAM)',   desc: 'Stereo navigation views that help engineers drive safely.' },
  MAHLI:   { name: 'Mars Hand Lens Imager (MAHLI)',desc: 'Close-ups of rocks and regolith—robotic geologist’s hand lens.' },
  MARDI:   { name: 'Mars Descent Imager (MARDI)',  desc: 'Descent/immediate post-landing views of the surface.' },
};

function sortNewestFirst(a: MarsPhoto, b: MarsPhoto): number {
  // Prefer earth_date, fallback to id/sol
  if (a.earth_date !== b.earth_date) return a.earth_date > b.earth_date ? -1 : 1;
  if ((a.id as number) !== (b.id as number)) return (b.id as number) - (a.id as number);
  return (b.sol as number) - (a.sol as number);
}

// ---------- main ----------
export async function missionRoverCam(role: Role): Promise<EnrichedMissionPlan> {
  let latestPhotos: MarsPhoto[] = [];

  try {
    const apiKey = await getApiKey(); // <- fetch & cache NASA key (if configured)
    const raw = await retry(
      () => getLatest('curiosity', apiKey ?? null),
      { attempts: MARS_ATTEMPTS, baseDelayMs: 1500 },
    );
    if (!isMarsPhotoArray(raw)) {
      logger.warn('[RoverCam] fetch returned unexpected shape; using empty photo list');
    } else {
      latestPhotos = raw.map(p => ({
        ...p,
        img_src: upgradeHttps(p.img_src) || p.img_src,
      })).sort(sortNewestFirst);
    }
    logger.info('[RoverCam] fetched latest photos', { count: latestPhotos.length });
  } catch (e) {
    logger.warn('[RoverCam] Mars photos fetch failed; continuing with educational fallback', { error: e });
  }

  // Log unknown codes for future map extension
  if (latestPhotos.length) {
    const known = new Set(Object.keys(cameraInfo));
    const seenCodes = new Set<string>();
    for (const p of latestPhotos) {
      const code = p.camera?.name;
      if (code) seenCodes.add(code);
    }
    const unknown = [...seenCodes].filter(c => !known.has(c));
    if (unknown.length) {
      logger.debug('[RoverCam] photos from unmapped camera codes observed', { codes: unknown });
    }
  }

  // Bucket by camera
  const topics: EnrichedTopic[] = [];
  let totalImages = 0;

  for (const code of Object.keys(cameraInfo)) {
    const info = cameraInfo[code];
    const seen = new Set<string>();

    const images: Img[] = latestPhotos
      .filter((p) => p.camera?.name === code)
      .map((p) => ({
        title: `Curiosity ${p.camera?.full_name ?? code} — Sol ${p.sol} (${p.earth_date})`,
        href: p.img_src,
        nasaId: String(p.id),
      }))
      .filter((img) => {
        if (!img.href || seen.has(img.href)) return false;
        seen.add(img.href);
        return true;
      })
      .slice(0, Math.max(1, Math.min(MAX_PER_CAMERA, 50)));

    if (images.length) {
      totalImages += images.length;
      logger.debug('[RoverCam] bucketed images for camera', { code, count: images.length });
    }

    topics.push(ensureTopic({
      title: info.name,
      summary: info.desc,
      images,
      keywords: ['Mars', 'Curiosity', code, info.name],
    }));
  }

  // If not enough live media, return educational fallback (non-empty & useful)
  if (totalImages < MIN_TOTAL) {
    logger.info('[RoverCam] insufficient live images; returning educational fallback', {
      totalImages,
      required: MIN_TOTAL,
    });

    const fallbackTopics = [
      ensureTopic({
        title: 'Hazard Cameras (FHAZ & RHAZ)',
        summary: 'These low-mounted cameras protect the rover by spotting rocks, slopes, and trenches in front and behind.',
      }),
      ensureTopic({
        title: 'Mastcam (MAST)',
        summary: 'Color images and panoramas from the rover’s “head” help scientists study layers, grains, and textures.',
      }),
      ensureTopic({
        title: 'ChemCam',
        summary: 'A laser vaporizes tiny spots on rocks; the spectrometer reads the glow to determine composition.',
      }),
      ensureTopic({
        title: 'Navcam (NAVCAM)',
        summary: 'Stereo views support autonomous navigation and help planners chart safe driving paths.',
      }),
    ];

    return ensureMissionPlan({
      missionTitle: 'Curiosity Rover Cameras',
      introduction: `Welcome, ${role}. Explore what each rover camera is designed to reveal about Mars. (Live images are currently limited or unavailable; showing an educational overview.)`,
      topics: fallbackTopics,
    });
  }

  logger.info('[RoverCam] returning mission with live images', {
    camerasWithImages: topics.filter(t => t.images.length > 0).length,
    totalTopics: topics.length,
    totalImages,
  });

  return ensureMissionPlan({
    missionTitle: 'Latest Photos from Curiosity',
    introduction: `Welcome, ${role}. Explore the Curiosity rover’s cameras through their latest images and see how each view supports science and driving on Mars.`,
    topics,
  });
}
