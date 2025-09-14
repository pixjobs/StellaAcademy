/* eslint-disable no-console */
import type { WorkerContext } from '../../context';
import type { Role, MarsPhoto } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic } from '@/types/mission';
import { fetchLatestMarsPhotos } from '@/lib/nasa';
import {
  ensureMissionPlan,
  ensureTopic,
  hasNasaApiKey,
  retry,
  logNasa,
} from '../shared/core';

function isMarsPhotoArray(x: unknown): x is MarsPhoto[] {
  return Array.isArray(x) && x.every((p) => {
    if (typeof p !== 'object' || p === null) return false;
    const ph = p as Partial<MarsPhoto>;
    return (
      typeof ph.img_src === 'string' &&
      typeof ph.earth_date === 'string' &&
      typeof ph.camera === 'object' &&
      ph.camera !== null &&
      typeof ph.camera.name === 'string'
    );
  });
}

export async function missionRoverCam(
  _role: Role,
  _context: WorkerContext,
): Promise<EnrichedMissionPlan> {
  // Try to fetch latest Curiosity photos if a NASA key is present.
  let latestPhotos: MarsPhoto[] = [];
  if (hasNasaApiKey()) {
    try {
      const raw = await retry(() => fetchLatestMarsPhotos('curiosity'), { attempts: 2 });
      latestPhotos = isMarsPhotoArray(raw) ? raw : [];
      logNasa('RoverCam latestPhotos', { count: latestPhotos.length });
    } catch (e) {
      console.warn('[mission][nasa] Mars photos failed (continuing with educational fallback).', e);
    }
  }

  // Camera code -> name/desc mapping (Curiosity)
  const cameraInfo: Record<string, { name: string; desc: string }> = {
    FHAZ: { name: 'Front Hazard Camera (FHAZ)', desc: 'Low-set views to spot rocks and slopes in the rover’s path.' },
    RHAZ: { name: 'Rear Hazard Camera (RHAZ)',  desc: 'Rearward hazard views to help avoid getting stuck.' },
    MAST: { name: 'Mast Camera (MAST)',         desc: 'Color imaging and video from the rover’s “head.”' },
    CHEMCAM: { name: 'Chemistry & Camera (ChemCam)', desc: 'Laser zaps rocks and reads their spectra to infer composition.' },
    NAVCAM: { name: 'Navigation Camera (NAVCAM)', desc: 'Stereo navigation views that help engineers drive safely.' },
  };

  // Bucket photos by camera code and build topics
  const topics: EnrichedTopic[] = [];
  const codes = Object.keys(cameraInfo);

  for (const code of codes) {
    const info = cameraInfo[code];
    const seen = new Set<string>();
    const images = latestPhotos
      .filter((p) => p.camera?.name === code)
      .map((p) => ({
        title: `Curiosity ${(p.camera?.full_name ?? code)} — ${p.earth_date}`,
        href: p.img_src,
      }))
      .filter((img) => {
        if (!img.href || seen.has(img.href)) return false;
        seen.add(img.href);
        return true;
      })
      .slice(0, 10);

    topics.push(ensureTopic({
      title: `Latest from ${info.name}`,
      summary: info.desc,
      images,
    }));
  }

  // If NASA was unavailable (or zero images), keep the mission educational & non-empty.
  const nonEmpty = topics.some((t) => t.images.length > 0);
  if (!nonEmpty) {
    // Provide a compact, deterministic set of topics without images so the UI never stalls.
    const fallback = [
      ensureTopic({
        title: 'Hazard Cameras (FHAZ & RHAZ)',
        summary: 'These low-mounted cameras protect the rover by spotting rocks, slopes, and trenches in front and behind.',
        images: [],
      }),
      ensureTopic({
        title: 'Mastcam (MAST)',
        summary: 'Color images and panoramas from the rover’s “head” help scientists study layers, grains, and textures.',
        images: [],
      }),
      ensureTopic({
        title: 'ChemCam',
        summary: 'A laser vaporizes tiny spots on rocks; the spectrometer reads the glow to determine composition.',
        images: [],
      }),
      ensureTopic({
        title: 'Navcam (NAVCAM)',
        summary: 'Stereo views support autonomous navigation and help planners chart safe driving paths.',
        images: [],
      }),
    ];

    return ensureMissionPlan({
      missionTitle: 'Latest Photos from Curiosity',
      introduction: 'Explore what each rover camera is designed to reveal about Mars. (Live images unavailable; showing educational overview.)',
      topics: fallback,
    });
  }

  return ensureMissionPlan({
    missionTitle: 'Latest Photos from Curiosity',
    introduction: 'Explore rover cameras through the latest Curiosity images and see how each view supports science and driving.',
    topics,
  });
}
