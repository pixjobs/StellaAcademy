import type { MetadataRoute } from 'next';
import { studyModules } from '@/lib/study-modules';
import { CONTENT_UPDATED, SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/journey', '/study', '/gallery', '/about', '/privacy'].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: p === '' ? 1 : 0.7,
  }));
  const modules = studyModules.map((m) => ({
    url: `${SITE_URL}/study/${m.id}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
  return [...pages, ...modules];
}
