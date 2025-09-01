'use client';

// CHANGED: Added `useEffect` to the import list
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useGame } from '@/lib/store';
import { useMissionChatQueued as useMissionChat } from '@/hooks/useMissionChatQueued';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // npm install lucide-react

import ChatDisplay, { type Message } from './ChatDisplay';
import ChatInput from './ChatInput';
import { Button } from './ui/button';

type Img = { title?: string; href?: string };
type Props = {
  mission?: string;
  images?: Img[];
  context?: string;
  initialImage?: number;
  initialMessage?: Message;
};

// --- Helper Functions ---
function normImages(arr?: Img[]): Img[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(x => ({ title: x.title ?? 'Untitled', href: x.href ?? '' }));
}
function lineFor(img: Img | undefined, idx1: number) {
  if (!img) return '';
  return `#${idx1} ${img.title?.trim() || 'Untitled'} – ${img.href?.trim() || ''}`;
}

// --- Main Component ---
export default function MissionControl({ mission = 'general', images = [], context, initialImage, initialMessage }: Props) {
  const role = useGame((s) => s.role);
  const pics = useMemo(() => normImages(images), [images]);

  const { messages, loading, sendMessage, stop, reset } = useMissionChat({ role, mission });

  const [sel, setSel] = useState(() => Math.max(0, (initialImage ?? 1) - 1));

  const rootRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    gsap.timeline()
      .from(rootRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' })
      .from(imageRef.current, { autoAlpha: 0, scale: 0.95, duration: 0.4, ease: 'power2.out' }, "-=0.2")
      .from('.quick-action-btn', { autoAlpha: 0, y: 20, stagger: 0.1, ease: 'power2.out' }, "-=0.2")
      .from('.chat-interface', { autoAlpha: 0, y: 20, ease: 'power2.out' }, "<");
  }, { scope: rootRef });

  // Cleanup GSAP timeline on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      tl.current?.kill();
    };
  }, []);

  const buildContext = useCallback((imgIndex: number) => {
    const lines = [`Student is learning about: ${mission}.`, context?.trim() || '', lineFor(pics[imgIndex], imgIndex + 1)];
    return lines.filter(Boolean).join('\n');
  }, [pics, mission, context]);

  useEffect(() => {
    if (!pics.length) return;
    const isChatEmpty = messages.length === 0 && !initialMessage;
    if (isChatEmpty) {
      const prompt = `Give a ${role}-friendly 2-line summary of image #${sel + 1}.`;
      sendMessage(prompt, buildContext(sel));
    }
  }, [pics.length, initialMessage, messages.length, role, sel, buildContext, sendMessage]);

  const choose = useCallback((newIndex: number) => {
    if (newIndex === sel || loading) return;

    // Kill any existing timeline to prevent overlaps from rapid clicks
    tl.current?.kill();

    tl.current = gsap.timeline({
      onComplete: () => {
        setSel(newIndex);
        reset();
        const prompt = `Give a ${role}-friendly 2-line summary of image #${newIndex + 1}.`;
        sendMessage(prompt, buildContext(newIndex));
      }
    });
    
    tl.current.to(imageRef.current, { autoAlpha: 0, scale: 0.98, duration: 0.25, ease: 'power2.in' });
  }, [sel, loading, reset, sendMessage, role, buildContext]);

  useGSAP(() => {
    gsap.to(imageRef.current, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
  }, { dependencies: [sel] });
  
  const handlePrev = () => choose((sel - 1 + pics.length) % pics.length);
  const handleNext = () => choose((sel + 1) % pics.length);

  const onSend = (p: string) => sendMessage(p, buildContext(sel));
  const chatMessages = useMemo(() => {
    const dynamicMessages = messages.filter(m => ['user', 'stella', 'error'].includes(m.role));
    return initialMessage ? [initialMessage, ...dynamicMessages] as Message[] : dynamicMessages as Message[];
  }, [messages, initialMessage]);

  if (pics.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-4 text-center">
        <h3 className="font-sans text-sm text-sky mb-2 font-semibold">Mission Standby</h3>
        <p className="text-sm">No visuals were retrieved for this objective.</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
      
      <div className="w-full h-full flex flex-col gap-4 sticky top-4">
        <div ref={imageRef} className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
          <img
            key={pics[sel].href}
            src={pics[sel].href}
            alt={pics[sel].title}
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs bg-gradient-to-t from-black/80 to-transparent text-slate-200">
            {pics[sel].title} • #{sel + 1}/{pics.length}
          </div>
          
          {pics.length > 1 && (
            <>
              <Button onClick={handlePrev} size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={handleNext} size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 min-h-[70vh] lg:min-h-0">
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => sendMessage(`Explain image #${sel + 1} at my level (${role}).`, buildContext(sel))} variant="outline" size="sm" className="quick-action-btn">Explain</Button>
            <Button onClick={() => sendMessage(`Quiz me on image #${sel + 1}. Give 3 short questions.`, buildContext(sel))} variant="outline" size="sm" className="quick-action-btn">Quiz Me</Button>
            <Button onClick={() => sendMessage(`One-sentence takeaway for image #${sel + 1}.`, buildContext(sel))} variant="outline" size="sm" className="quick-action-btn">Summary</Button>
        </div>

        <div className="chat-interface flex-1 flex flex-col rounded-xl bg-slate-900/50 border border-white/10 p-2 md:p-4">
          <div className="flex-1 overflow-y-auto">
            <ChatDisplay messages={chatMessages} />
          </div>
          <div className="mt-2 pt-2 border-t border-white/10">
            {loading && <div className="text-xs text-sky animate-pulse mb-1 px-2">Stella is thinking…</div>}
            <ChatInput onSend={onSend} onStop={stop} isLoading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}