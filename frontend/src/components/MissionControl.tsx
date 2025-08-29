// src/components/MissionControl.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/lib/store';
import { useMissionChat } from '@/hooks/useMissionChat';

import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import ImageSelector from './ImageSelector';
import ChatDisplay from './ChatDisplay';
import ChatInput from './ChatInput';

type Img = { title?: string; href?: string };
type Props = { mission?: string; images?: Img[]; context?: string };

export default function MissionControl({ mission = 'general', images = [], context }: Props) {
  const role = useGame((s) => s.role);
  // The 'error' state is no longer needed here; the hook handles it.
  const { messages, loading, sendMessage, stop, reset } = useMissionChat({ role, mission });
  const [selectedImageNumber, setSelectedImageNumber] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect is the "proactive" start. It runs once when images are first loaded.
    if (images.length > 0 && selectedImageNumber === null) {
      const initialImage = 1;
      setSelectedImageNumber(initialImage);
      const prompt = `Give me a ${role}-friendly 2-line summary of image #${initialImage}.`;
      sendMessage(prompt, buildContextForImage(initialImage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]); // Dependency array ensures this runs when images arrive from the server.

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(rootRef.current, { duration: 0.5, autoAlpha: 0 })
      .from('.image-thumb', { duration: 0.3, autoAlpha: 0, y: 20, stagger: 0.05 }, "-=0.2")
      .from('.chat-interface-child', { duration: 0.4, autoAlpha: 0, y: 20, stagger: 0.1 });
  }, { scope: rootRef });

  const handleImageSelect = (imageNumber: number) => {
    if (selectedImageNumber === imageNumber || loading) return;

    const tl = gsap.timeline({
      onComplete: () => {
        reset();
        setSelectedImageNumber(imageNumber);
        const prompt = `Give me a ${role}-friendly 2-line summary of image #${imageNumber}.`;
        sendMessage(prompt, buildContextForImage(imageNumber));
      },
    });
    tl.to(chatDisplayRef.current, { duration: 0.3, autoAlpha: 0, y: 10 });
  };

  const buildContextForImage = (imgNumber: number): string => {
    const img = images[imgNumber - 1];
    if (!img) return context ?? '';
    return `#${imgNumber} ${img.title ?? 'Untitled'} – ${img.href ?? ''}`;
  };

  const handleSendPrompt = (prompt: string) => {
    const currentContext = selectedImageNumber ? buildContextForImage(selectedImageNumber) : context;
    sendMessage(prompt, currentContext);
  };
  
  if (!images || images.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md text-center">
        <div className="font-pixel text-sm text-sky mb-2">Mission Standby</div>
        <p>Contacting NASA Deep Space Network... No images found for this mission.</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md opacity-0">
      <div className="font-pixel text-sm text-sky mb-2">Engage with Mission Control</div>
      <ImageSelector images={images} selected={selectedImageNumber} onSelect={handleImageSelect} />
      
      <div ref={chatDisplayRef} className="chat-interface-child">
        {/* The 'error' prop is gone, as ChatDisplay handles it internally */}
        <ChatDisplay messages={messages} />
        {loading && <div className="text-xs text-sky animate-pulse my-1">Stella is typing...</div>}
      </div>

      <div className="chat-interface-child">
        <ChatInput onSend={handleSendPrompt} onStop={stop} isLoading={loading} />
      </div>
      
      <div className="mt-2 text-[11px] text-slate-500 chat-interface-child">
        Role: <b>{role}</b> • Mission: <b>{mission}</b>
      </div>
    </div>
  );
}