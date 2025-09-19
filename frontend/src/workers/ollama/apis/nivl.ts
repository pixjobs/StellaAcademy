/* eslint-disable no-console */

/**
 * @file nivl.ts
 * @description A comprehensive client for the NASA Image and Video Library (NIVL) API.
 * NOTE: This API is public and does not use an API key.
 */

import { fetchJson } from './http';
import { logger } from '../utils/logger';

const NIVL_ROOT = 'https://images-api.nasa.gov';

/* ─────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */
export type NivlMediaType = 'image' | 'video' | 'audio';

export interface NivlData {
  title?: string;
  description?: string;
  nasa_id?: string;
  center?: string;
  keywords?: string[];
  date_created?: string;
  media_type?: NivlMediaType;
}

export interface NivlLink {
  href: string;
  rel?: string;
  render?: string;
  prompt?: string;
}

export interface NivlItem {
  href?: string;
  data?: NivlData[];
  links?: NivlLink[];
}

type Coll<T = NivlItem> = {
  collection?: {
    href?: string;
    items?: T[];
    links?: NivlLink[];
    metadata?: { total_hits?: number };
    version?: string;
  }
};

type AssetItem = { href: string };
type CaptionsLocation = { location: string };

export interface NivlSearchParams {
  q?: string;
  media_type?: NivlMediaType | NivlMediaType[];
  page?: number;
  page_size?: number;
  center?: string;
  description?: string;
  description_508?: string;
  keywords?: string | string[];
  location?: string;
  nasa_id?: string;
  photographer?: string;
  secondary_creator?: string;
  title?: string;
  year_start?: string | number;
  year_end?: string | number;
}

export interface NivlSearchResult {
  items: NivlItem[];
  totalHits?: number;
  collectionHref?: string;
  nextHref?: string;
}

/* ─────────────────────────────────────────────────────────
   Small utils
────────────────────────────────────────────────────────── */

const toCsv = (v?: string | string[]): string | undefined =>
  v == null ? undefined : Array.isArray(v) ? v.join(',') : v;

function qs(o: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) {
    if (v != null && v !== '') p.set(k, v);
  }
  return p.toString();
}

export const firstData = (it: NivlItem) => it.data?.[0];
export const getPreviewHref = (it: NivlItem) => it.links?.find(l => l.rel === 'preview')?.href;

export function getPosterHref(it: NivlItem): string | undefined {
  const link = it.links?.find(l => l.rel === 'preview' && (l.render === 'image' || !l.render));
  return link?.href;
}

/* ─────────────────────────────────────────────────────────
   /search + pagination
────────────────────────────────────────────────────────── */

/**
 * Performs a detailed search against the NIVL API.
 * @param p The search parameters.
 * @returns A promise that resolves to the search result.
 */
export async function searchNIVLFull(p: NivlSearchParams): Promise<NivlSearchResult> {
  const query = qs({
    q: p.q,
    center: p.center,
    description: p.description,
    description_508: p.description_508,
    keywords: toCsv(p.keywords),
    location: p.location,
    media_type: toCsv(Array.isArray(p.media_type) ? p.media_type : p.media_type ? [p.media_type] : undefined),
    nasa_id: p.nasa_id,
    page: p.page?.toString(),
    page_size: p.page_size?.toString(),
    photographer: p.photographer,
    secondary_creator: p.secondary_creator,
    title: p.title,
    year_start: p.year_start?.toString(),
    year_end: p.year_end?.toString(),
  });
  const url = `${NIVL_ROOT}/search${query ? `?${query}` : ''}`;
  logger.debug('GET (NIVL)', url);

  try {
    // No apiKey is passed, which is correct for this endpoint.
    const j = await fetchJson<Coll>(url);
    const c = j.collection;
    return {
      items: c?.items ?? [],
      totalHits: c?.metadata?.total_hits,
      collectionHref: c?.href,
      nextHref: c?.links?.find((l: { rel?: string; href?: string }) => l.rel === 'next')?.href,
    };
  } catch (e) {
    logger.error('[nivl] search failed:', e);
    throw e;
  }
}

/* ─────────────────────────────────────────────────────────
   /asset (manifest)
────────────────────────────────────────────────────────── */

/**
 * Retrieves the asset manifest for a given NASA ID.
 * @param nasaId The NASA ID of the asset.
 * @returns A promise that resolves to an array of file URLs.
 */
export async function getAssetManifest(nasaId: string): Promise<string[]> {
  const url = `${NIVL_ROOT}/asset/${encodeURIComponent(nasaId)}`;
  const j = await fetchJson<Coll<AssetItem>>(url);
  return (j.collection?.items ?? [])
  .map((i: { href?: string }) => i.href)
  .filter((x: string | undefined): x is string => !!x);
}

/* ─────────────────────────────────────────────────────────
   /captions (video)
────────────────────────────────────────────────────────── */

/**
 * Retrieves the location of the captions file for a video asset.
 * @param nasaId The NASA ID of the video asset.
 * @returns A promise that resolves to the URL of the captions file, or null.
 */
export async function getCaptionsLocation(nasaId: string): Promise<string | null> {
  try {
    const url = `${NIVL_ROOT}/captions/${encodeURIComponent(nasaId)}`;
    const j = await fetchJson<CaptionsLocation>(url);
    return j?.location ?? null;
  } catch (e) {
    logger.warn(`[nivl] captions not found for ${nasaId}:`, e);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────
   Helpers for consumers
────────────────────────────────────────────────────────── */

/** Extract a compact card-ish view for UI lists (works for image or video items). */
export function toCard(item: NivlItem) {
  const d = firstData(item);
  return {
    nasaId: d?.nasa_id,
    title: d?.title ?? 'Untitled',
    mediaType: d?.media_type ?? 'image',
    date: d?.date_created,
    previewHref: getPreviewHref(item) ?? getPosterHref(item),
  };
}