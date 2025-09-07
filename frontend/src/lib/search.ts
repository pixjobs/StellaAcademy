import { getGoogleCustomSearchKey, getGoogleCustomSearchCx } from '@/lib/secrets';
import type { LinkPreview } from '@/types/llm';

// --- Improved Type Definitions for API Response ---
// REASON: Using specific types instead of `any` improves code safety and autocompletion.
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

// --- Helper Functions (Unchanged, but with comments) ---

/**
 * Removes bracketed tags like [mission] to avoid affecting search relevance.
 */
function sanitizeQuery(q: string): string {
  return q.replace(/\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Ensures the number of search results is between 1 and 10.
 */
function clampNum(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(10, Math.floor(n)));
}

/**
 * Masks sensitive keys for safe logging.
 */
function mask(val?: string, show = 3): string {
  if (!val) return '(unset)';
  if (val.length <= show + 2) return `${val[0]}***`;
  return `${val.slice(0, show)}***${val.slice(-2)}`;
}

// --- Main Search Function (Refactored) ---

export async function googleCustomSearch(q: string, num = 5): Promise<LinkPreview[]> {
  // REASON: A top-level try/catch block is crucial. It catches errors from the `get...`
  // functions (e.g., if secrets aren't found) and any other unexpected errors.
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
      q: sanitizeQuery(q).slice(0, 2048), // Google's limit is 2048 chars
      num: String(clampNum(num)),
      safe: 'off',
      // fields reduces response size/cost
      fields: 'items(title,link,snippet)',
    });

    const endpoint = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;

    const res = await fetch(endpoint, { method: 'GET' });

    if (!res.ok) {
      // Try to parse the error response for more detailed logging
      let detail: GoogleErrorResponse = {};
      try {
        detail = await res.json();
      } catch {
        // Ignore if the error response isn't valid JSON
      }
      console.error('[search] Google Search API returned an HTTP error.', {
        status: res.status,
        statusText: res.statusText,
        errorMessage: detail.error?.message,
        errorStatus: detail.error?.status,
        reasons: detail.error?.errors?.map(e => e.reason).join(', '),
      });
      return [];
    }

    const data: GoogleSearchResponse = await res.json();

    if (!data.items || data.items.length === 0) {
      return []; // No results found
    }

    // Map results to the LinkPreview type
    return data.items.map((item): LinkPreview => {
      const url = String(item.link || '').trim();
      let faviconUrl = '';
      try {
        // Use a privacy-friendly favicon service
        const host = new URL(url).hostname;
        faviconUrl = `https://icons.duckduckgo.com/ip3/${host}.ico`;
      } catch {
        // Silently fail if the URL is invalid, leaving faviconUrl empty
      }

      return {
        url,
        title: String(item.title ?? 'Untitled'),
        meta: String(item.snippet ?? ''),
        faviconUrl,
      };
    });
  } catch (e: any) {
    console.error('[search] An unexpected error occurred during the search operation:', e?.message || e);
    return []; // Always return an empty array on failure
  }
}

export default { googleCustomSearch };