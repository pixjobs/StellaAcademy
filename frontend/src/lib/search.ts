import { getGoogleCustomSearchKey, getGoogleCustomSearchCx } from '@/lib/secrets';
import type { LinkPreview } from '@/types/llm';

// --- Type Definitions for API Response ---
type GoogleSearchItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

type GoogleSearchResponse = {
  items?: GoogleSearchItem[];
};

type GoogleErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
};

// --- Helper Functions ---

function sanitizeQuery(q: string): string {
  return q.replace(/\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
}

function clampNum(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(10, Math.floor(n)));
}

function mask(val?: string, show = 3): string {
  if (!val) return '(unset)';
  if (val.length <= show + 2) return `${val[0]}***`;
  return `${val.slice(0, show)}***${val.slice(-2)}`;
}

// --- Main Search Function ---

export async function googleCustomSearch(q: string, num = 5): Promise<LinkPreview[]> {
  try {
    const key = await getGoogleCustomSearchKey();
    const cx = await getGoogleCustomSearchCx();

    if (!key || !cx) {
      console.warn('[search] Missing Google Custom Search API Key or CX. Skipping search.', {
        key: mask(key),
        cx: mask(cx),
      });
      return [];
    }

    const params = new URLSearchParams({
      key,
      cx,
      q: sanitizeQuery(q).slice(0, 2048),
      num: String(clampNum(num)),
      safe: 'off',
      fields: 'items(title,link,snippet)',
    });

    const endpoint = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;

    const res = await fetch(endpoint, { method: 'GET' });

    if (!res.ok) {
      let detail: GoogleErrorResponse = {};
      try {
        // FIX 1: Add type assertion for the error response JSON.
        // This resolves the `unknown` type error when handling failed API calls.
        detail = (await res.json()) as GoogleErrorResponse;
      } catch {
        // Ignore if the error response isn't valid JSON
      }
      console.error('[search] Google Search API returned an HTTP error.', {
        status: res.status,
        statusText: res.statusText,
        errorMessage: detail.error?.message,
        errorStatus: detail.error?.status,
        reasons: detail.error?.errors?.map((e) => e.reason).join(', '),
      });
      return [];
    }

    // FIX 2: Add type assertion for the success response JSON.
    // This resolves the primary `unknown` type error for the search results.
    const data = (await res.json()) as GoogleSearchResponse;

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // LINT FIX: Add explicit type for the 'item' parameter for maximum clarity.
    return data.items.map((item: GoogleSearchItem): LinkPreview => {
      const url = String(item.link || '').trim();
      let faviconUrl = '';
      try {
        const host = new URL(url).hostname;
        faviconUrl = `https://icons.duckduckgo.com/ip3/${host}.ico`;
      } catch {
        // Silently fail if the URL is invalid
      }

      return {
        url,
        title: String(item.title ?? 'Untitled'),
        snippet: String(item.snippet ?? ''),
        faviconUrl,
      };
    });
  } catch (e: unknown) {
    // This catch block is already correctly typed using 'unknown'
    const error = e as Error;
    console.error('[search] An unexpected error occurred during the search operation:', error?.message || e);
    return [];
  }
}

// This pattern correctly avoids anonymous default export linting errors.
const searchService = { googleCustomSearch };
export default searchService;