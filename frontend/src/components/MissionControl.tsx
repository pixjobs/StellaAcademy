'use client';

import { useEffect, useMemo, useRef, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useGame } from '@/lib/store';
import { useMissionChatQueued as useMissionChat } from '@/hooks/useMissionChatQueued';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ChevronLeft, ChevronRight, BookOpen, FlaskConical, Link as LinkIcon,
  Image as ImageIcon, Plus, Trash2, Bookmark, Sparkles, SlidersHorizontal,
} from 'lucide-react';

import ChatDisplay, { type Message } from './ChatDisplay';
import ChatInput from './ChatInput';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// NOTE: For a larger project, these should be moved to a shared `types.ts` file.
type NoteType = 'concept' | 'formula' | 'reference' | 'image';

type Note = {
  id: string; type: NoteType; title: string; body?: string;
  url?: string; imgHref?: string; createdAt: number;
};

type Img = {
  title: string;
  href: string;
};

export type MissionControlProps = {
  mission?: string; images?: Img[]; context?: string;
  initialImage?: number; initialMessage?: Message;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const urlRegex = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?)/g;

function usePersistentNotes(missionKey: string) {
  const storageKey = `stella:notes:${missionKey}`;
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      return raw ? (JSON.parse(raw) as Note[]) : [];
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);
  return { notes, setNotes };
}

export default function MissionControl({
  mission = 'general', images = [], context, initialImage, initialMessage,
}: MissionControlProps) {
  const { role } = useGame();
  const { notes, setNotes } = usePersistentNotes(mission);
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

  const addNote = useCallback((partialNote: Partial<Note>) => {
    setNotes(prev => [{
      id: uid(), type: partialNote.type ?? 'concept', title: partialNote.title ?? 'Untitled Note',
      body: partialNote.body, url: partialNote.url, imgHref: partialNote.imgHref, createdAt: Date.now(),
    }, ...prev]);
  }, [setNotes]);

  const removeNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const handleImageChange = (newIndex: number) => {
    if (newIndex === selImageIndex || loading) return;
    setSelImageIndex(newIndex);
    reset();
    sendMessage(`Give a ${role}-friendly 2-line summary of the new image.`, buildContext());
  };

  const handleCaptureMessage = useCallback((message: Message) => {
    if (!message.text) return;
    const links = Array.from(message.text.matchAll(urlRegex), m => m[0]);
    if (links.length > 0) {
      addNote({ type: 'reference', title: 'Captured Link', url: links[0], body: message.text.replace(links[0], '').trim() });
    } else {
      addNote({ type: 'concept', title: 'Captured Note', body: message.text });
    }
  }, [addNote]);
  
  // --- THIS IS THE FIX ---
  // The new handler function required by the upgraded ChatDisplay component.
  const handleCaptureFormula = useCallback((formulaText: string) => {
    addNote({
      type: 'formula',
      title: 'Captured Formula',
      body: formulaText,
    });
  }, [addNote]);
  
  const handleNoteClick = useCallback((note: Note) => {
    let prompt = '';
    switch (note.type) {
      case 'concept': prompt = `Explain this concept in a simpler way: "${note.title}"`; break;
      case 'formula': prompt = `Give me a practice problem using this: ${note.body}`; break;
      case 'reference': prompt = `Summarize the key idea from this reference: ${note.url}`; break;
      case 'image': prompt = `Tell me one surprising fact about this image: "${note.title}"`; break;
    }
    setChatInputValue(prompt);
    setIsNotebookOpen(false);
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
            onCaptureFormula={handleCaptureFormula} // <-- The new prop is now passed down
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

/* ─────────────────────────────────────────────────────────
   Child Components
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
  onCaptureMessage: (message: Message) => void; onCaptureFormula: (formula: string) => void; // <-- New prop added here
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

type NotebookPanelProps = {
  notes: Note[]; onAddNote: (partialNote: Partial<Note>) => void;
  onRemoveNote: (id: string) => void; onNoteClick: (note: Note) => void;
};
function NotebookPanel({ notes, onAddNote, onRemoveNote, onNoteClick }: NotebookPanelProps) {
  const [tab, setTab] = useState<NoteType>('concept');
  const filteredNotes = useMemo(() => notes.filter((n) => n.type === tab), [notes, tab]);

  return (
    <aside className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg shadow-lg p-3 md:p-4">
      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-3">
        <Sparkles className="w-5 h-5 text-gold"/>
        <h3 className="font-pixel text-lg text-gold">Mission Notebook</h3>
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TabButton active={tab === 'concept'} onClick={() => setTab('concept')} icon={<BookOpen className="w-4 h-4" />}>Notes</TabButton>
        <TabButton active={tab === 'formula'} onClick={() => setTab('formula')} icon={<FlaskConical className="w-4 h-4" />}>Formulas</TabButton>
        <TabButton active={tab === 'reference'} onClick={() => setTab('reference')} icon={<LinkIcon className="w-4 h-4" />}>Links</TabButton>
        <TabButton active={tab === 'image'} onClick={() => setTab('image')} icon={<ImageIcon className="w-4 h-4" />}>Images</TabButton>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="w-full mb-3" onClick={() => onAddNote({ type: tab, title: 'New Note', body: '...' })}><Plus className="w-4 h-4 mr-1"/>Add New {tab}</Button>
        </TooltipTrigger>
        <TooltipContent>Manually add a new item to this tab.</TooltipContent>
      </Tooltip>
      {filteredNotes.length === 0 ? (
        <div className="text-xs text-muted-foreground border border-dashed border-white/20 rounded-lg p-3 text-center">
          <p>No {tab}s saved yet.</p>
          <p className="mt-1">Click the <Bookmark className="w-3 h-3 inline-block -mt-1 mx-1"/> icon on a message to save it here.</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {filteredNotes.map((note) => (
            <li key={note.id} className="rounded-lg border border-white/10 bg-white/5 p-2 group">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onNoteClick(note)} className="text-left flex-1 space-y-1">
                  <div className="text-xs font-semibold text-foreground truncate group-hover:text-gold transition-colors">{note.title}</div>
                  {note.url && <a className="text-[11px] underline text-sky-400 break-all block" href={note.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{note.url}</a>}
                  {note.imgHref && <img src={note.imgHref} alt={note.title} className="rounded-md border border-white/10 mt-1" />}
                  {note.body && <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">{note.body}</p>}
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => onRemoveNote(note.id)} className="p-1 rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive" aria-label="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Note</TooltipContent>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

type TabButtonProps = { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode };
function TabButton({ active, onClick, children, icon }: TabButtonProps) {
  return (
    <Button type="button" onClick={onClick} variant={active ? 'secondary' : 'ghost'} size="sm" className="flex items-center gap-1.5">
      {icon} {children}
    </Button>
  );
}