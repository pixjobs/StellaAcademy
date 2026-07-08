'use client';

import Link from 'next/link';
import Image from 'next/image';

const galleryImages = [
  { id: '1', title: 'Galaxy Carriage', src: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413' },
  { id: '2', title: 'Cosmic Nebula', src: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a' },
  { id: '3', title: 'Stellar Nursery', src: 'https://images.unsplash.com/photo-1534447677768-be436bb09401' },
  { id: '4', title: 'Planetary Surface', src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa' },
];

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Space Gallery
        </h1>
        
        <p className="text-xl text-slate-300 mb-8">
          Explore stunning space imagery curated from around the universe
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {galleryImages.map((image) => (
            <div key={image.id} className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-cyan-400">{image.title}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/" className="text-cyan-400 hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
