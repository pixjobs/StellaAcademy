'use client';

import { useEffect, useMemo, useRef, useState, useCallback, ComponentType, Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
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

  const hasImages = useMemo(() => images && images.length > 0, [images]);
  const [selImageIndex, setSelImageIndex] = useState(() => Math.max(0, initialImage ?? 0));
  const currentPic = useMemo(() => (hasImages ? images[selImageIndex] : undefined), [hasImages, images, selImageIndex]);

  const [chatInputValue, setChatInputValue] = useState('');
  const [mobileView, setMobileView] = useState<'chat' | 'notebook'>('chat');

  const rootRef = useRef<HTMLDivElement>(null);
  useGSAP(() => { gsap.from(rootRef.current, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }); }, { scope: rootRef });

  const buildContext = useCallback(() => {
    const lines = [`Student is learning about: ${mission}.`, context?.trim() || ''];
    if (currentPic) {
      const title = currentPic.title?.trim() ?? 'Untitled Image';
      lines.push(`Current Image: #${selImageIndex + 1} ${title} – ${currentPic.href.trim()}`);
    }
    return lines.filter(Boolean).join('\n');
  }, [mission, context, currentPic, selImageIndex]);

  useEffect(() => {
    if (hasImages && messages.length === 0 && !initialMessage) {
      sendMessage(`Give a ${role}-friendly 2-line summary of the current image.`, buildContext());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasImages]);

  const onSend = (text: string) => {
    sendMessage(text, buildContext());
    setChatInputValue('');
    setMobileView('chat');
  };

  const handleImageChange = (newIndex: number) => {
    if (!hasImages || isChatLoading) return;
    const totalImages = images.length;
    const nextIndex = (newIndex + totalImages) % totalImages;
    if (nextIndex === selImageIndex) return;

    setSelImageIndex(nextIndex);
    reset();

    const nextPic = images[nextIndex];
    if (!nextPic) return;

    const title = nextPic.title?.trim() ?? 'Untitled Image';
    const newContext = [
      `Student is learning about: ${mission}.`, context?.trim() || '',
      `Current Image: #${nextIndex + 1} ${title} – ${nextPic.href.trim()}`,
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

  return (
    <TooltipProvider>
      <div
        ref={rootRef}
        className={clsx(
          "flex flex-col gap-5 items-start min-h-0",
          hasImages && "xl:grid xl:grid-cols-[1.05fr_1.95fr]"
        )}
      >
        {hasImages && currentPic && (
          <div className="w-full flex flex-col gap-3 min-h-0">
            <VisualPanel
              currentImage={currentPic}
              imageIndex={selImageIndex}
              imageCount={images.length}
              onPrev={() => handleImageChange(selImageIndex - 1)}
              onNext={() => handleImageChange(selImageIndex + 1)}
              onQuickAction={(prompt) => sendMessage(prompt, buildContext())}
              onSaveImage={() => addNote({ type: 'image', title: currentPic.title ?? 'Untitled Image', imgHref: currentPic.href })}
            />
          </div>
        )}

        <div className={clsx("w-full flex flex-col gap-3 min-h-0", !hasImages && "xl:grid xl:grid-cols-2")}>
          <div className="flex items-center justify-center rounded-lg bg-black/20 p-1 xl:hidden">
            <TabButton icon={MessageSquare} label="Chat" isActive={mobileView === 'chat'} onClick={() => setMobileView('chat')} />
            <TabButton icon={BookOpen} label="Notebook" isActive={mobileView === 'notebook'} onClick={() => setMobileView('notebook')} />
          </div>

          <div className={clsx("min-h-0", { "hidden xl:block": mobileView !== 'chat' })}>
            <ChatPanel
              messages={chatMessages}
              isLoading={isChatLoading}
              onSend={onSend}
              onStop={stop}
              onCaptureMessage={handleCaptureMessage}
              inputValue={chatInputValue}
              setInputValue={setChatInputValue}
            />
          </div>

          <div className={clsx("min-h-0", { "hidden xl:block": mobileView !== 'notebook' })}>
            <NotebookPanel
              notes={notes}
              isLoading={isNotesLoading}
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

  const title = currentImage.title ?? 'Untitled Image';

  return (
    <div className="w-full h-full flex flex-col gap-3 sticky top-4">
      <div ref={imageRef} className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
        <Image
          key={currentImage.href}
          src={currentImage.href}
          alt={title}
          fill
          className="object-contain"
          sizes="(max-width: 1279px) 90vw, 33vw"
        />
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs bg-gradient-to-t from-black/80 to-transparent text-slate-200">
          {title} • #{imageIndex + 1}/{imageCount}
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onSaveImage} size="sm">
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
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
};

function ChatPanel({
  messages, isLoading, onSend, onStop, onCaptureMessage, inputValue, setInputValue
}: ChatPanelProps) {
  return (
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
        />
      </div>
      <div className="mt-2 pt-2 border-t border-white/10">
        {isLoading && <div className="text-xs text-gold animate-pulse mb-2 px-2">Stella is thinking…</div>}
        <ChatInput onSend={onSend} onStop={onStop} isLoading={isLoading} value={inputValue} setValue={setInputValue} />
      </div>
    </div>
  );
}