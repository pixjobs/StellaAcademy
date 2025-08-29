// src/components/ChatDisplay.tsx
'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Make sure the Message type includes the 'error' role
export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

type ChatDisplayProps = {
  messages: Message[];
};

export default function ChatDisplay({ messages }: ChatDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.chat-message:last-child',
      { autoAlpha: 0, y: 25 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, { dependencies: [messages], scope: containerRef });

  // Helper to determine styles based on message role
  const getRoleStyles = (role: Message['role']) => {
    switch (role) {
      case 'user':
        return 'items-end';
      case 'stella':
        return 'items-start';
      case 'error':
        return 'items-center'; // Center the error message
      default:
        return 'items-start';
    }
  };

  const getBubbleStyles = (role: Message['role']) => {
    switch (role) {
      case 'user':
        return 'bg-sky-900/70';
      case 'stella':
        return 'bg-slate-800/80';
      case 'error':
        // --- THIS IS THE NEW STYLE ---
        return 'bg-red-900/50 border border-red-500/60 text-red-300 w-full text-center';
      default:
        return 'bg-slate-800/80';
    }
  };

  return (
    <div ref={containerRef} className="text-sm whitespace-pre-wrap text-slate-200 min-h-[5lh] max-h-72 overflow-y-auto rounded-lg border border-slate-800/70 p-3 bg-slate-950/30 space-y-4 smooth-scroll">
      {messages.length === 0 && (
        <div className="text-slate-400">
          Stella is standing by. The first mission briefing will appear here.
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={`chat-message flex flex-col ${getRoleStyles(msg.role)}`}>
          <div className={`rounded-lg px-3 py-2 max-w-[90%] ${getBubbleStyles(msg.role)}`}>
            {msg.role === 'stella' && msg.text.length === 0 ? (
              <span className="blinking-cursor">▍</span>
            ) : (
              msg.text
            )}
          </div>
        </div>
      ))}
    </div>
  );
}