/* eslint-disable no-console */

import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, Img } from '@/types/mission';
import { ensureMissionPlan, ensureTopic, retry, tryNivlQueries, logger } from '../shared/core';
import type { GenerationOpts } from '../shared/types';

// A small curated set with alias terms to improve search variety
const TARGETS: Array<{ label: string; aliases: string[] }> = [
  { label: 'Orion Nebula',        aliases: ['M42', 'NGC 1976', 'Messier 42'] },
  { label: 'Andromeda Galaxy',    aliases: ['M31', 'NGC 224', 'Messier 31'] },
  { label: 'Pillars of Creation', aliases: ['Eagle Nebula', 'M16', 'NGC 6611'] },
  { label: 'Crab Nebula',         aliases: ['M1', 'NGC 1952', 'Tau A'] },
  { label: 'Hubble Deep Field',   aliases: ['HDF', 'Hubble Deep Field-North'] },
  { label: 'Ring Nebula',         aliases: ['M57', 'NGC 6720'] },
  { label: 'Carina Nebula',       aliases: ['NGC 3372', 'Eta Carinae Nebula'] },
  { label: 'Whirlpool Galaxy',    aliases: ['M51', 'NGC 5194'] },
  { label: 'Eagle Nebula',        aliases: ['M16', 'NGC 6611'] },
  { label: 'Horsehead Nebula',    aliases: ['Barnard 33', 'IC 434'] },
];

// simple helpers
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function dedupeByHref<T extends { href?: string | null }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const h = (it.href ?? '').trim();
    if (!h || seen.has(h)) continue;
    seen.add(h);
    out.push(it);
  }
  return out;
}
// prefer larger-looking assets and titles that include target name
function sortBest(arr: Img[], targetHint?: string): Img[] {
  const score = (x: Img): number => {
    let s = 0;
    const t = (x.title ?? '').toLowerCase();
    if (targetHint && t.includes(targetHint.toLowerCase())) s += 3;
    const h = (x.href ?? '').toLowerCase();
    if (/_orig|_large|_full|_hi|2048|4096/.test(h)) s += 2;
    if (/\.png(\?|$)/.test(h)) s += 1; // often larger; jpg is fine too
    return s;
  };
  return [...arr].sort((a, b) => score(b) - score(a));
}

/**
 * Keep exported name exactly `missionCelestialInvestigator`.
 */
export async function missionCelestialInvestigator(
  role: Role,
  _context: WorkerContext,
  options?: GenerationOpts,
): Promise<EnrichedMissionPlan> {
  const seed = (options?.seedIndex ?? Date.now()) >>> 0;
  const attempt = Math.max(1, options?.attempt ?? 1);
  const idx = ((seed ^ (attempt * 0x9E3779B1)) >>> 0) % TARGETS.length;
  const pick = TARGETS[idx];

  const MIN_IMAGES = 4;
  const MAX_IMAGES = clamp(Number(process.env.CELESTIAL_MAX_IMAGES ?? 12), 4, 24);

  // Build search seeds from target + telescopes
  const baseSeeds = [pick.label, ...pick.aliases];
  const scopeSeeds = [
    'Hubble Space Telescope',
    'James Webb Space Telescope',
    'ESO',
    'Wide Field',
    'infrared',
  ];
  const seeds = [...new Set([...baseSeeds, ...scopeSeeds])];

  let images: Img[] = [];
  try {
    const fetched = await retry(
      () =>
        tryNivlQueries(seeds, {
          limitPerQuery: 6,
          mediaTypes: ['image'],
          randomizePage: true,
        }),
      { attempts: 2, baseDelayMs: 900 },
    );
    const cleaned = sortBest(dedupeByHref(fetched), pick.label).slice(0, Math.max(1, Math.min(MAX_IMAGES, 50)));
    images = cleaned;
    logger.debug('[CelestialInvestigator] NIVL', {
      target: pick.label,
      seeds,
      fetched: fetched.length,
      kept: images.length,
    });
  } catch (e) {
    logger.warn('[mission][nasa] NIVL failed (celestial-investigator).', e);
  }

  // If we came up too light, keep the mission educational but non-empty
  if (images.length < MIN_IMAGES) {
    images = images.slice(0, Math.max(1, images.length)); // keep whatever we got
  }

  const topicTitle = `Investigation: ${pick.label}`;
  const topic = ensureTopic({
    title: topicTitle,
    summary: `Images of ${pick.label} from multiple observatories. Compare filters, wavelengths, and structures.`,
    images,
    keywords: [pick.label, ...pick.aliases, 'HST', 'JWST'],
  });

  return ensureMissionPlan({
    missionTitle: `Celestial Investigator: ${pick.label}`,
    introduction: `Welcome, ${role}. Analyze ${pick.label} with multi-observatory imagery and guided prompts.`,
    topics: [topic],
  });
}
