// src/workers/shims/search.d.ts
declare module '@/lib/search' {
  import type { GoogleSearchFn } from '@/types/llm';

  // Named export shape
  export const googleCustomSearch: GoogleSearchFn;

  // Default export may be the function itself, or an object containing it.
  const _default:
    | GoogleSearchFn
    | { googleCustomSearch?: GoogleSearchFn };

  export default _default;
}
