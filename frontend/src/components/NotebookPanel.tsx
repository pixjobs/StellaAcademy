// components/NotebookPanel.tsx
'use client';

import { useMemo, useState } from 'react';
import { Note, NoteType } from '@/types/mission';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  BookOpen,
  Bookmark,
  FlaskConical,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
// --- 1. IMPORT YOUR OFFICIAL RENDERER ---
import MarkdownRenderer from './MarkdownRenderer';

/* ────────────────────────────────────────────────────────────────────────
   Props & Type Definitions
   ──────────────────────────────────────────────────────────────────────── */

type NotebookPanelProps = {
  notes: Note[];
  onAddNote: (partialNote: Partial<Note>) => void;
  onRemoveNote: (id: string) => void;
  onNoteClick: (note: Note) => void;
};

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
};

/* ────────────────────────────────────────────────────────────────────────
   Main Notebook Component
   ──────────────────────────────────────────────────────────────────────── */

export default function NotebookPanel({
  notes,
  onAddNote,
  onRemoveNote,
  onNoteClick,
}: NotebookPanelProps) {
  const [tab, setTab] = useState<NoteType>('concept');
  const filteredNotes = useMemo(() => notes.filter((n) => n.type === tab), [notes, tab]);

  return (
    <TooltipProvider>
      <aside className="rounded-xl bg-card border border-border backdrop-blur-lg shadow-lg p-3 md:p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 border-b border-border pb-3">
          <Sparkles className="w-5 h-5 text-gold" />
          <h3 className="font-pixel text-lg text-gold">Mission Notebook</h3>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <TabButton active={tab === 'concept'} onClick={() => setTab('concept')} icon={<BookOpen />}>
            Notes
          </TabButton>
          <TabButton active={tab === 'formula'} onClick={() => setTab('formula')} icon={<FlaskConical />}>
            Formulas
          </TabButton>
          <TabButton active={tab === 'reference'} onClick={() => setTab('reference')} icon={<LinkIcon />}>
            Links
          </TabButton>
          <TabButton active={tab === 'image'} onClick={() => setTab('image')} icon={<ImageIcon />}>
            Images
          </TabButton>
        </div>

        {/* Manual Add Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-3"
              onClick={() => onAddNote({ type: tab, title: `New ${tab}`, body: '...' })}
            >
              <Plus className="w-4 h-4 mr-1" /> Add New {tab}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manually add a new item to this tab.</TooltipContent>
        </Tooltip>

        {/* Notes List or Empty State */}
        {filteredNotes.length === 0 ? (
          <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3 text-center">
            <p>No {tab}s saved yet.</p>
            <p className="mt-1">
              Click the <Bookmark className="w-3 h-3 inline-block -mt-1 mx-1" /> icon on a message to save it.
            </p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onClick={onNoteClick}
                onRemove={onRemoveNote}
              />
            ))}
          </ul>
        )}
      </aside>
    </TooltipProvider>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Child Components
   ──────────────────────────────────────────────────────────────────────── */

function NoteItem({
  note,
  onClick,
  onRemove,
}: {
  note: Note;
  onClick: (note: Note) => void;
  onRemove: (id: string) => void;
}) {
  // No more useEffect or useRef needed here. The renderer handles it all.
  return (
    <li className="rounded-lg border border-border bg-background/50 group relative">
      <button
        onClick={() => onClick(note)}
        className="text-left w-full p-2.5 space-y-2 rounded-lg transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {/* Note Title */}
        <div className="text-sm font-semibold text-foreground truncate group-hover:text-gold transition-colors">
          {note.title}
        </div>

        {/* Note URL (if present) */}
        {note.url && (
          <a
            href={note.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs underline text-sky-400 break-all block hover:text-sky-300"
          >
            {note.url}
          </a>
        )}

        {/* Note Image (if present) */}
        {note.imgHref && (
          <img
            src={note.imgHref}
            alt={note.title}
            className="rounded-md border border-border mt-1"
          />
        )}

        {/* --- 2. USE THE OFFICIAL RENDERER --- */}
        {/* This ensures perfect visual consistency with the chat display. */}
        {note.body && (
          <div className="pt-2 border-t border-border/50 text-left">
            <MarkdownRenderer>{note.body}</MarkdownRenderer>
          </div>
        )}
      </button>

      {/* Delete Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onRemove(note.id)}
            className="absolute top-2 right-2 p-1 rounded text-muted-foreground opacity-50 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
            aria-label="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Delete Note</TooltipContent>
      </Tooltip>
    </li>
  );
}

function TabButton({ active, onClick, children, icon }: TabButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className="flex items-center gap-1.5"
    >
      <div className="w-4 h-4">{icon}</div>
      {children}
    </Button>
  );
}