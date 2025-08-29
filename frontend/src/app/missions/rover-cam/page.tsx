// app/missions/rover-cam/page.tsx

import { fetchMarsPhotos } from '@/lib/nasa';
// highlight-start
import MissionControl from '@/components/MissionControl'; // 1. IMPORT the new component
// highlight-end

export default async function RoverCamPage() {
  // Fetch a specific set of photos from the Curiosity rover's Navcam
  const photos = await fetchMarsPhotos({ rover: 'curiosity', sol: 1000, camera: 'navcam' });

  // Format the data for the component, creating a descriptive title for each image
  const images = photos.map(p => ({
    title: `${p.rover} – ${p.camera} (${p.earthDate})`,
    href: p.imgSrc
  }));

  return (
    <section className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="font-pixel text-xl text-gold mb-2">🤖 Rover Cam</h1>
      <p className="text-slate-300 mb-4">
        Select a photo from the Curiosity rover's Navcam, then ask Stella a question about what you see.
      </p>

      {/* highlight-start */}
      {/* 2. SWAP the old component tag for the new one */}
      <MissionControl mission="rover-cam" images={images} />
      {/* highlight-end */}
    </section>
  );
}