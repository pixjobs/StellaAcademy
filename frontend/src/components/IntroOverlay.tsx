'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Define props interface separately first
interface IntroOverlayProps {
  onStart?: () => void;
  title?: string;
  copy?: string;
  badges?: string[];
  imageSrc?: string;
  ctaLabel?: string;
}

// Main component function
export default function IntroOverlay(props: IntroOverlayProps) {
  const {
    onStart = undefined,
    title = 'Stella Academy',
    copy = `Exploring the cosmos through knowledge and discovery. Learn about space, view stunning imagery, and ignite your curiosity.`,
    badges = ['Education First', 'Space Exploration', 'Free & Open'],
    imageSrc = '/stella.png',
  } = props;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center space-y-8">
          {/* Title and Badge */}
          <div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {title}
            </h1>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {badges.map((badge, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-sm">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Main Image */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl mb-8">
            <img
              src={imageSrc}
              alt="Stella Academy"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
            {copy}
          </p>

          {/* Call to Action */}
          <div className="flex gap-4 justify-center">
            {onStart && (
              <button
                onClick={onStart}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
              >
                {ctaLabel || 'Get Started'}
              </button>
            )}
            
            <Link
              href="/about"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
