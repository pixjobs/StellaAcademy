'use client';

import { useEffect, useMemo, useRef, useState, useCallback, ComponentType, Dispatch, SetStateAction } from 'react';
import { useGame } from '@/lib/store';
import { NotesProvider, useNotes } from '@/lib/notes/NotesContext';
import { useMissionChatQueued as useMissionChat } from '@/hooks/useMissionChatQueued';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronLeft, ChevronRight, Bookmark, MessageSquare, BookOpen } from 'lucide-react';
import clsx from 'clsx';

// UI and Child Components
import ChatDisplay, { type Message } from './ChatDisplay';
import ChatInput from './ChatInput';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import NotebookPanel from './NotebookPanel';

// Types and Context
import { Img, Note } from '@/types/mission';

export type MissionControlProps = {
  mission?: string;
  images?: Img[];
  context?: string;
  initialImage?: number;
  initialMessage?: Message;
};

const urlRegex = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?)/g;

function MissionControlInternal({
  mission = 'general',
  images = [],
  context,
  initialImage,
  initialMessage,
}: MissionControlProps) {
  const { role } = useGame();
  const { notes, addNote, removeNote, isLoading: isNotesLoading } = useNotes();
  const { messages, loading: isChatLoading, sendMessage, stop, reset } = useMissionChat({ role, mission });

  const [selImageIndex, setSelImageIndex] = useState(() => Math.max(0, initialImage ?? 0));
  const [chatInputValue, setChatInputValue] = useState('');
  const [mobileView, setMobileView] = useState<'chat' | 'notebook'>('chat');

  const rootRef = useRef<HTMLDivElement>(null);
  useGSAP(() => { gsap.from(rootRef.current, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }); }, { scope: rootRef });

  const buildContext = useCallback(() => {
    const currentPic = images[selImageIndex];
    if (!currentPic) return `Student is learning about: ${mission}.`;
    const lines = [
      `Student is learning about: ${mission}.`,
      context?.trim() || '',
      `Current Image: #${selImageIndex + 1} ${currentPic.title.trim()} – ${currentPic.href.trim()}`,
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
    setMobileView('chat');
  };

  const handleImageChange = (newIndex: number) => {
    if (isChatLoading) return;
    const totalImages = images.length;
    const nextIndex = (newIndex + totalImages) % totalImages;
    if (nextIndex === selImageIndex) return;

    setSelImageIndex(nextIndex);
    reset();

    const nextPic = images[nextIndex];
    const newContext = [
      `Student is learning about: ${mission}.`, context?.trim() || '',
      `Current Image: #${nextIndex + 1} ${nextPic.title.trim()} – ${nextPic.href.trim()}`,
    ].filter(Boolean).join('\n');
    sendMessage(`Give a ${role}-friendly 2-line summary of the new image.`, newContext);
  };

  const handleCaptureMessage = (message: Message) => {
    if (!message.text) return;
    const links = Array.from(message.text.matchAll(urlRegex), m => m[0]);
    addNote(links.length > 0
      ? { type: 'reference', title: 'Captured Link', url: links[0], body: message.text.replace(links[0], '').trim() }
      : { type: 'concept', title: 'Captured Note', body: message.text }
    );
  };

  const handleCaptureFormula = (formulaText: string) => {
    addNote({ type: 'formula', title: 'Captured Formula', body: formulaText });
  };

  const handleNoteClick = useCallback((note: Note) => {
    let prompt = note.body || `Can you elaborate on "${note.title}"?`;
    if (note.type === 'reference' && note.url) prompt = `Tell me more about this link: ${note.url}`;
    if (note.type === 'image') prompt = `What are the key features of the image titled "${note.title}"?`;

    setChatInputValue(prompt);
    setMobileView('chat');
    document.querySelector<HTMLInputElement>('#chat-input')?.focus();
  }, []);

  const chatMessages = useMemo(() => {
    const dynamicMessages = messages.filter((m) => ['user', 'stella', 'error'].includes(m.role)) as Message[];
    return initialMessage ? [initialMessage, ...dynamicMessages] : dynamicMessages;
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
      {/*
        OPTIMIZATION:
        - Changed the layout to `flex flex-col` on mobile/tablet. This allows the child elements to grow and fill the available space.
        - On `xl` screens, it switches back to a `grid` layout for the two-column view.
        - `min-h-0` is kept to prevent flex/grid children from overflowing their parent.
      */}
      <div
        ref={rootRef}
        className="flex flex-col xl:grid xl:grid-cols-[1.05fr_1.95fr] gap-5 items-start min-h-0"
      >
        {/* LEFT COLUMN: Contains Visuals and, on desktop, the Notebook */}
        <div className="flex flex-col gap-3 min-h-0">
          <VisualPanel
            currentImage={images[selImageIndex]}
            imageIndex={selImageIndex}
            imageCount={images.length}
            onPrev={() => handleImageChange(selImageIndex - 1)}
            onNext={() => handleImageChange(selImageIndex + 1)}
            onQuickAction={(prompt) => sendMessage(prompt, buildContext())}
            onSaveImage={() => addNote({ type: 'image', title: images[selImageIndex].title, imgHref: images[selImageIndex].href })}
          />

          {/* Mobile tab switcher */}
          <div className="flex items-center justify-center rounded-lg bg-black/20 p-1 xl:hidden">
            <TabButton icon={MessageSquare} label="Chat" isActive={mobileView === 'chat'} onClick={() => setMobileView('chat')} />
            <TabButton icon={BookOpen} label="Notebook" isActive={mobileView === 'notebook'} onClick={() => setMobileView('notebook')} />
          </div>

          {/*
            OPTIMIZATION:
            - Added `flex-1` and `min-h-0` for the mobile notebook view.
            - This makes the notebook panel expand to fill the remaining vertical space on the screen, improving mobile usability.
          */}
          <div className={clsx({ hidden: mobileView !== 'notebook' }, 'xl:hidden flex-1 min-h-0')}>
            <NotebookPanel
              notes={notes}
              isLoading={isNotesLoading}
              onRemoveNote={removeNote}
              onNoteClick={handleNoteClick}
            />
          </div>

          {/* DESKTOP Notes: shown below the image inside the same column */}
          <div className="hidden xl:block min-h-0">
            <div className="sticky top-4">
              <NotebookPanel
                notes={notes}
                isLoading={isNotesLoading}
                onRemoveNote={removeNote}
                onNoteClick={handleNoteClick}
              />
            </div>
          </div>
        </div>

        {/*
          OPTIMIZATION:
          - This container now uses `flex-1` on mobile to fill available space.
          - On desktop (`xl:block`), it acts as a standard grid cell.
          - This ensures the ChatPanel inside it can use `h-full` effectively on all screen sizes.
        */}
        <div className={clsx({ hidden: mobileView !== 'chat' }, 'xl:block flex-1 min-h-0')}>
          <ChatPanel
            messages={chatMessages}
            isLoading={isChatLoading}
            onSend={onSend}
            onStop={stop}
            onCaptureMessage={handleCaptureMessage}
            onCaptureFormula={handleCaptureFormula}
            inputValue={chatInputValue}
            setInputValue={setChatInputValue}
          />
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

/* ----------------------------- Child Components ---------------------------- */

type TabButtonProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const TabButton = ({ icon: Icon, label, isActive, onClick }: TabButtonProps) => (
  <Button
    onClick={onClick}
    variant="ghost"
    size="sm"
    className={clsx(
      'flex-1 justify-center transition-colors duration-200',
      { 'bg-sky-900/30 text-white': isActive, 'text-slate-400 hover:text-white': !isActive }
    )}
  >
    <Icon className="w-4 h-4 mr-2" />
    {label}
  </Button>
);

type VisualPanelProps = {
  currentImage: Img;
  imageIndex: number;
  imageCount: number;
  onPrev: () => void;
  onNext: () => void;
  onQuickAction: (prompt: string) => void;
  onSaveImage: () => void;
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
            <Button onClick={onNext} size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-4 w-4" /></Button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onQuickAction('Explain this image.')} variant="outline" size="sm">Explain</Button>
        <Button onClick={() => onQuickAction('Quiz me on this image.')} variant="outline" size="sm">Quiz Me</Button>
        <Button onClick={() => onQuickAction('Give me a one-sentence summary.')} variant="outline" size="sm">Summary</Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onSaveImage} size="sm" variant="default">
              <Bookmark className="w-4 h-4 mr-1.5" />
              Save Image
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save to Mission Notebook</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

type ChatPanelProps = {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onCaptureMessage: (message: Message) => void;
  onCaptureFormula: (formula: string) => void;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
};

function ChatPanel({
  messages, isLoading, onSend, onStop, onCaptureMessage, onCaptureFormula, inputValue, setInputValue
}: ChatPanelProps) {
  return (
    /*
      OPTIMIZATION:
      - Removed the rigid, viewport-based height classes (e.g., `h-[50vh]`, `lg:h-[calc(100vh-10rem)]`).
      - Added `h-full`, which makes the chat panel fill the height of its parent container.
      - This single change makes the component flexible. It will be taller on desktop without pushing down the footer,
        and it will correctly fill the remaining space on mobile screens.
    */
    <div
      className="
        chat-interface flex flex-col rounded-xl bg-white/5 border border-white/10
        backdrop-blur-lg shadow-lg p-2 md:p-3 min-h-0 h-full
      "
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ChatDisplay
          messages={messages}
          onCapture={onCaptureMessage}
          onCaptureFormula={onCaptureFormula}
        />
      </div>
      <div className="mt-2 pt-2 border-t border-white/10">
        {isLoading && <div className="text-xs text-gold animate-pulse mb-2 px-2">Stella is thinking…</div>}
        <ChatInput onSend={onSend} onStop={onStop} isLoading={isLoading} value={inputValue} setValue={setInputValue} />
      </div>
    </div>
  );
}