'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './globals.css';

interface SpaceFact {
  id: string;
  title: string;
  description: string;
  image?: string;
}

const spaceFacts: SpaceFact[] = [
  { 
    id: '1', 
    title: 'The Moon is Drifting Away', 
    description: 'The Moon is currently moving away from Earth at about 3.8 cm per year. It will continue to do so for billions of years.'
  },
  { 
    id: '2', 
    title: 'Mars is Half the Size of Earth', 
    description: 'Mars has a diameter of about 6,779 km, about half that of Earth. This explains why it has such weak gravity.'
  },
  { 
    id: '3', 
    title: 'The Great Red Spot', 
    description: 'Jupiter\'s Great Red Spot is a storm that has been raging for at least 400 years. It is large enough to contain two or three Earths.'
  },
  { 
    id: '4', 
    title: 'There\'s Water on the Moon', 
    description: 'NASA discovered water ice in permanently shadowed craters on the Moon. This could be a valuable resource for future lunar missions.'
  },
  { 
    id: '5', 
    title: 'Stars are Born in Dust Clouds', 
    description: 'Stars are born in dense clouds of gas and dust called nebulae. Over millions of years, gravity pulls these materials together.'
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Stella Academy
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Exploring the cosmos through knowledge, imagination, and discovery.
          </p>
          <Link 
            href="/about" 
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg transition-colors"
          >
            Start Exploring →
          </Link>
        </div>
      </section>

      {/* Featured Section */}
      <section className="max-w-6xl mx-auto px-4 -mt-10">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-6">Featured Discoveries</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {spaceFacts.map((fact) => (
                <div key={fact.id} className="space-y-2">
                  <h3 className="text-xl font-semibold text-cyan-400">{fact.title}</h3>
                  <p className="text-slate-300">{fact.description}</p>
                </div>
              ))}
            </div>
            <div className="border-l-2 border-purple-500 pl-8">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Why This Matters</h3>
              <p className="text-slate-300 mb-4">
                Space exploration drives technological advancement and inspires the next generation of scientists and engineers.
              </p>
              
              {/* Mock NASA APOD */}
              <div className="rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=400&fit=crop" 
                  alt="Stunning cosmic landscape"
                  className="w-full h-48 object-cover"
                />
                <div className="bg-black/50 p-4 text-sm text-slate-300">
                  Sample NASA Astronomy Picture of the Day (APOD)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-6">Explore More</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            href="/about" 
            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-xl p-6 transition-colors"
          >
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-bold text-lg mb-1">Learn</h3>
            <p className="text-sm text-slate-400">Browse our space knowledge</p>
          </Link>
          
          <Link 
            href="/missions" 
            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-xl p-6 transition-colors"
          >
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="font-bold text-lg mb-1">Missions</h3>
            <p className="text-sm text-slate-400">Interactive learning challenges</p>
          </Link>
          
          <Link 
            href="/gallery" 
            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-xl p-6 transition-colors"
          >
            <div className="text-3xl mb-2">🖼️</div>
            <h3 className="font-bold text-lg mb-1">Gallery</h3>
            <p className="text-sm text-slate-400">Visual space discoveries</p>
          </Link>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="border-t border-white/10 mt-16 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2026 Stella Academy. Powered by open-source exploration.</p>
        </div>
      </footer>
    </main>
  );
}
