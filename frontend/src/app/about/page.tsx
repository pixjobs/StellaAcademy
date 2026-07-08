'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          About Stella Academy
        </h1>
        
        <div className="space-y-6 text-slate-300">
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">Our Mission</h2>
            <p className="text-lg">
              Stella Academy is dedicated to making space exploration accessible to everyone. Through curated educational content, 
              stunning imagery, and interactive learning experiences, we inspire the next generation of explorers.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">What We Believe</h2>
            <p className="text-lg">
              We believe that space science should beinclusive, engaging, and freely accessible. Our mission is to bridge the gap 
              between professional space research and everyday understanding, making the wonders of the universe available to everyone.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">Our Approach</h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
              <li>Curated educational content for various age groups</li>
              <li>Clean, accessible interfaces without unnecessary complexity</li>
              <li>Integration of real space science and imagery</li>
              <li>Fully open-source and community-driven</li>
            </ul>
          </div>

          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">Get Involved</h2>
            <p className="text-lg">
              Stella Academy is free and open-source. We welcome contributions from developers, educators, and space enthusiasts 
              alike. Read our <Link href="/" className="text-cyan-400 hover:underline">README</Link> for more information.
            </p>
          </div>
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
