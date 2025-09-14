/* eslint-disable no-console */
import { fetchJson } from './http';

export interface NivlData {
  title?: string;
  description?: string;
  nasa_id?: string;
  center?: string;
  keywords?: string[];
  date_created?: string;
}

export interface NivlLink {
  href: string;
  rel?: string;        // e.g., "preview"
  render?: string;
}

export interface NivlItem {
  href?: string;
  data?: NivlData[];
  links?: NivlLink[];
}

export async function searchNIVL(query: string, opts?: { limit?: number }): Promise<NivlItem[]> {
  const limit = Math.max(1, Math.min(25, opts?.limit ?? 8));
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page=1`;
  const json = await fetchJson<{ collection?: { items?: NivlItem[] } }>(url);
  const items = json.collection?.items ?? [];
  return items.slice(0, limit);
}
