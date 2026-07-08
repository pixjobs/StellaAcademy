'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function MissionsPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Rocket Lab Mission
        </h1>
        
        <div className="bg-white/5 p-8 rounded-xl">
          <p className="text-xl text-slate-300 mb-6">
            This feature is under development. We're currently building our interactive mission experience with 
            space-themed challenges and educational content.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-cyan-400 mb-2">Coming Soon</h2>
              <p className="text-slate-300">
                Interactive space missions with NASA imagery, quizzes, and educational content
              </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-purple-400 mb-2">Features Planned</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Space knowledge quizzes</li>
                <li>NASA imagery galleries</li>
                <li>Interactive content</li>
                <li>Role-based learning paths</li>
              </ul>
            </div>
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
