import type { MetadataRoute } from 'next';
import { studyModules } from '@/lib/study-modules';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/journey', '/study', '/gallery', '/about'].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: p === '/gallery' ? ('daily' as const) : ('monthly' as const),
    priority: p === '' ? 1 : 0.7,
  }));
  const modules = studyModules.map((m) => ({
    url: `${SITE_URL}/study/${m.id}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
  return [...pages, ...modules];
}
