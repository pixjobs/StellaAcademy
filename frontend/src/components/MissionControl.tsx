// MissionControl.tsx
'use client';

import { useEffect, useMemo, useRef, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useGame } from '@/lib/store';
import { useMissionChatQueued as useMissionChat } from '@/hooks/useMissionChatQueued';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ChevronLeft, ChevronRight, Bookmark, SlidersHorizontal,
} from 'lucide-react';

// UI and Child Components
import ChatDisplay, { type Message } from './ChatDisplay';
import ChatInput from './ChatInput';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import NotebookPanel from './NotebookPanel';

// Types and Context
import { Img, Note } from '@/types/mission';
import { NotesProvider, useNotes } from '@/lib/notes/NotesContext';

export type MissionControlProps = {
  mission?: string; images?: Img[]; context?: string;
  initialImage?: number; initialMessage?: Message;
};

const urlRegex = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?)/g;

function MissionControlInternal({
  mission = 'general', images = [], context, initialImage, initialMessage,
}: MissionControlProps) {
  const { role } = useGame();
  const { notes, addNote, removeNote } = useNotes();
  const { messages, loading, sendMessage, stop, reset } = useMissionChat({ role, mission });

  const [selImageIndex, setSelImageIndex] = useState(() => Math.max(0, initialImage ?? 0));
  const [chatInputValue, setChatInputValue] = useState('');
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  useGSAP(() => { gsap.from(rootRef.current, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }); }, { scope: rootRef });

  const buildContext = useCallback(() => {
    const currentPic = images[selImageIndex];
    const lines = [
      `Student is learning about: ${mission}.`, context?.trim() || '',
      `Current Image: #${selImageIndex + 1} ${currentPic?.title.trim() ?? ''} – ${currentPic?.href.trim() ?? ''}`,
    ];
    return lines.filter(Boolean).join('\n');
  }, [images, mission, context, selImageIndex]);

  useEffect(() => {
    if (images.length > 0 && messages.length === 0 && !initialMessage) {
      sendMessage(`Give a ${role}-friendly 2-line summary of the current image.`, buildContext());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  const onSend = (text: string) => {
    sendMessage(text, buildContext());
    setChatInputValue('');
  };

  const handleImageChange = (newIndex: number) => {
    if (newIndex === selImageIndex || loading) return;
    setSelImageIndex(newIndex);
    reset();
    sendMessage(`Give a ${role}-friendly 2-line summary of the new image.`, buildContext());
  };

  const handleCaptureMessage = (message: Message) => {
    if (!message.text) return;
    const links = Array.from(message.text.matchAll(urlRegex), m => m[0]);
    if (links.length > 0) {
      addNote({ type: 'reference', title: 'Captured Link', url: links[0], body: message.text.replace(links[0], '').trim() });
    } else {
      addNote({ type: 'concept', title: 'Captured Note', body: message.text });
    }
  };
  
  const handleCaptureFormula = (formulaText: string) => {
    addNote({ type: 'formula', title: 'Captured Formula', body: formulaText });
  };
  
  const handleNoteClick = useCallback((note: Note) => {
    let prompt = '';

    // If the note has a body, that's the most valuable content. Use it directly.
    if (note.body) {
      prompt = note.body;
    } 
    // For other types without a body, generate a sensible prompt as a fallback.
    else {
      switch (note.type) {
        case 'reference':
          prompt = `Tell me more about this link: ${note.url}`;
          break;
        case 'image':
          prompt = `What are the key features of the image titled "${note.title}"?`;
          break;
        default:
          prompt = `Can you elaborate on "${note.title}"?`;
          break;
      }
    }
    
    setChatInputValue(prompt);
    setIsNotebookOpen(false); // Close notebook on mobile
    // Ensure the input is focused so the user can immediately start typing or send.
    document.querySelector<HTMLInputElement>('#chat-input')?.focus();
  }, []);

  const chatMessages = useMemo(() => {
    const dynamicMessages = messages.filter((m) => ['user', 'stella', 'error'].includes(m.role));
    return (initialMessage ? [initialMessage, ...dynamicMessages] : dynamicMessages);
  }, [messages, initialMessage]);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg p-4 text-center">
        <h3 className="font-pixel text-lg text-gold mb-2 font-semibold">Mission Standby</h3>
        <p className="text-sm">No visuals were retrieved for this objective.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div ref={rootRef} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1.5fr] gap-5 items-start">
        <VisualPanel
          currentImage={images[selImageIndex]}
          imageIndex={selImageIndex}
          imageCount={images.length}
          onPrev={() => handleImageChange((selImageIndex - 1 + images.length) % images.length)}
          onNext={() => handleImageChange((selImageIndex + 1) % images.length)}
          onQuickAction={(prompt) => sendMessage(prompt, buildContext())}
          onSaveImage={() => addNote({ type: 'image', title: images[selImageIndex].title, imgHref: images[selImageIndex].href })}
        />
        <div className="flex flex-col gap-5">
          <ChatPanel
            messages={chatMessages}
            isLoading={loading}
            onSend={onSend}
            onStop={stop}
            onCaptureMessage={handleCaptureMessage}
            onCaptureFormula={handleCaptureFormula}
            inputValue={chatInputValue}
            setInputValue={setChatInputValue}
            onToggleNotebook={() => setIsNotebookOpen(!isNotebookOpen)}
          />
          <div className={isNotebookOpen ? 'block' : 'hidden lg:block'}>
            <NotebookPanel
              notes={notes}
              onAddNote={addNote}
              onRemoveNote={removeNote}
              onNoteClick={handleNoteClick}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function MissionControl(props: MissionControlProps) {
  return (
    <NotesProvider missionKey={props.mission || 'general'}>
      <MissionControlInternal {...props} />
    </NotesProvider>
  );
}


/* ─────────────────────────────────────────────────────────
   Child Components (VisualPanel and ChatPanel)
   ────────────────────────────────────────────────────────── */

type VisualPanelProps = {
  currentImage: Img; imageIndex: number; imageCount: number;
  onPrev: () => void; onNext: () => void;
  onQuickAction: (prompt: string) => void; onSaveImage: () => void;
};
function VisualPanel({ currentImage, imageIndex, imageCount, onPrev, onNext, onQuickAction, onSaveImage }: VisualPanelProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(imageRef.current, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
  }, { dependencies: [currentImage] });

  return (
    <div className="w-full h-full flex flex-col gap-3 sticky top-4">
      <div ref={imageRef} className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
        <img key={currentImage.href} src={currentImage.href} alt={currentImage.title} className="w-full h-full object-contain" />
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs bg-gradient-to-t from-black/80 to-transparent text-slate-200">
          {currentImage.title} • #{imageIndex + 1}/{imageCount}
        </div>
        {imageCount > 1 && (
          <>
            <Button onClick={onPrev} size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="h-4 w-4" /></Button>
            <Button onClick={onNext} size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="h-4 w-4" /></Button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onQuickAction('Explain this image.')} variant="outline" size="sm">Explain</Button>
        <Button onClick={() => onQuickAction('Quiz me on this image.')} variant="outline" size="sm">Quiz Me</Button>
        <Button onClick={() => onQuickAction('Give me a one-sentence summary.')} variant="outline" size="sm">Summary</Button>
        <Button onClick={onSaveImage} size="sm" variant="default"><Bookmark className="w-4 h-4 mr-1.5"/>Save Image</Button>
      </div>
    </div>
  );
}

type ChatPanelProps = {
  messages: Message[]; isLoading: boolean; onSend: (text: string) => void; onStop: () => void;
  onCaptureMessage: (message: Message) => void; onCaptureFormula: (formula: string) => void;
  inputValue: string; setInputValue: Dispatch<SetStateAction<string>>; onToggleNotebook: () => void;
};
function ChatPanel({ messages, isLoading, onSend, onStop, onCaptureMessage, onCaptureFormula, inputValue, setInputValue, onToggleNotebook }: ChatPanelProps) {
  return (
    <div className="chat-interface flex flex-col rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg shadow-lg p-2 md:p-3 min-h-[70vh] lg:min-h-0">
      <div className="flex items-center justify-end lg:hidden mb-2 px-1">
          <Button onClick={onToggleNotebook} variant="ghost" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2"/>
              Notebook
          </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ChatDisplay messages={messages} onCapture={onCaptureMessage} onCaptureFormula={onCaptureFormula} />
      </div>
      <div className="mt-2 pt-2 border-t border-white/10">
        {isLoading && <div className="text-xs text-gold animate-pulse mb-2 px-2">Stella is thinking…</div>}
        <ChatInput onSend={onSend} onStop={onStop} isLoading={isLoading} value={inputValue} setValue={setInputValue} />
      </div>
    </div>
  );
}