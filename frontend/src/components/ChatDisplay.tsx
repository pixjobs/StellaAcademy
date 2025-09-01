'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { clsx } from 'clsx';

export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

type ChatDisplayProps = {
  messages: Message[];
  maxLength?: number;
};

// --- Refined styles for better readability ---
const ROLE_STYLES = {
  container: {
    user: 'items-end',
    stella: 'items-start stella',
    error: 'items-center',
  },
  bubble: {
    user: 'bg-sky-900/80 border-sky-400/30 text-cyan-200 font-sans text-sm',
    stella: 'bg-slate-800/80 border-mint/40 text-mint font-sans text-sm leading-relaxed',
    error: 'bg-red-900/60 border-red-400/70 text-red-200 font-mono text-xs w-full text-center',
  },
};

export default function ChatDisplay({ messages, maxLength = 400 }: ChatDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null); // Anchor for reliable scrolling
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  // --- Animation Hook (for typewriter and fade-in) ---
  useGSAP(() => {
    if (!containerRef.current?.lastElementChild) return;
    const lastMsgContainer = containerRef.current.lastElementChild as HTMLElement;

    gsap.from(lastMsgContainer, { autoAlpha: 0, y: 20, duration: 0.4, ease: 'power2.out' });

    if (lastMsgContainer.classList.contains('stella')) {
      const textElement = lastMsgContainer.querySelector('.animatable-text');
      const lastMessage = messages[messages.length - 1];

      if (textElement && lastMessage?.text) {
        const fullText = lastMessage.text.trim();
        textElement.textContent = ''; // Clear for animation
        const anim = gsap.to(textElement, {
          duration: Math.max(0.5, fullText.length * 0.02), // Slightly faster typing
          text: fullText,
          ease: 'none',
        });
        return () => { anim.kill(); }; // Cleanup
      }
    }
  }, { dependencies: [messages], scope: containerRef });

  // --- Scrolling Hook (more reliable than GSAP's plugin for this use case) ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleExpanded = (id: string) => {
    setExpandedMessages(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div
      ref={containerRef}
      className="text-sm whitespace-pre-wrap min-h-[5lh] max-h-72 overflow-y-auto rounded-lg border border-slate-800/70 p-3 bg-slate-950/40 space-y-3"
    >
      {messages.length === 0 ? (
        <div className="text-slate-500 italic font-sans text-xs tracking-wide">
          Stella is standing by...
        </div>
      ) : (
        messages.map((msg) => {
          const isLong = msg.text.length > maxLength;
          const isExpanded = expandedMessages[msg.id];
          const content = isLong && !isExpanded ? `${msg.text.slice(0, maxLength)}…` : msg.text;

          return (
            <div
              key={msg.id}
              className={clsx('chat-message flex flex-col', ROLE_STYLES.container[msg.role])}
            >
              <div className={clsx('rounded-lg px-3 py-2 max-w-[85%] drop-shadow-lg', ROLE_STYLES.bubble[msg.role])}>
                {msg.role === 'stella' && !msg.text ? (
                  <span className="blinking-cursor">▍</span>
                ) : (
                  <>
                    <span className="animatable-text">{content}</span>
                    {isLong && !isExpanded && (
                      <button
                        onClick={() => toggleExpanded(msg.id)}
                        className="ml-1 text-xs text-sky-400 underline font-sans"
                      >
                        show more
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
      {/* Invisible anchor div for reliable scrolling */}
      <div ref={bottomRef} />
    </div>
  );
}