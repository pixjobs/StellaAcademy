// app/missions/space-poster/page.tsx

import { fetchAPOD } from '@/lib/nasa';
// highlight-start
import MissionControl from '@/components/MissionControl'; // 1. IMPORT the new component
// highlight-end

export default async function SpacePosterPage() {
  // Fetch today's Astronomy Picture of the Day (APOD)
  const apod = await fetchAPOD();

  // Create an array with a single image, only if the APOD has a valid URL
  const images = apod.bgUrl ? [{ title: apod.title, href: apod.bgUrl }] : [];

  return (
    <section className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="font-pixel text-xl text-gold mb-2">🖼️ Space Poster</h1>
      <p className="text-slate-300 mb-4">
        Today’s Astronomy Picture of the Day is loaded. Ask Stella to write a poster caption for it.
      </p>
      
      {/* highlight-start */}
      {/* 2. SWAP the old component tag for the new one */}
      <MissionControl mission="space-poster" images={images} />
      {/* highlight-end */}
    </section>
  );
}