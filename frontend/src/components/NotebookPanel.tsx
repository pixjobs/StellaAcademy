// components/NotebookPanel.tsx
import { Note } from '@/types/mission';
import { Button } from './ui/button';
import { X, FileText, Link, Sigma, Image as ImageIcon, Loader2 } from 'lucide-react';

type NotebookPanelProps = {
  notes: Note[];
  isLoading: boolean;
  onRemoveNote: (id: string) => void;
  onNoteClick: (note: Note) => void;
};

const getNoteIcon = (type: Note['type']) => {
  switch (type) {
    case 'concept': return <FileText className="w-4 h-4 text-sky-400" />;
    case 'reference': return <Link className="w-4 h-4 text-emerald-400" />;
    case 'formula': return <Sigma className="w-4 h-4 text-amber-400" />;
    case 'image': return <ImageIcon className="w-4 h-4 text-fuchsia-400" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

export default function NotebookPanel({ notes, isLoading, onRemoveNote, onNoteClick }: NotebookPanelProps) {
  return (
    <div className="flex flex-col rounded-xl bg-slate-900/50 border border-white/10 backdrop-blur-lg shadow-lg p-3 min-h-[70vh] md:min-h-0">
      <h3 className="font-pixel text-lg text-gold mb-3 px-1">Mission Notebook</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Loading notes...</span>
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No notes saved yet. Use the bookmark icon to save.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onNoteClick(note)}
              className="group relative flex flex-col p-2.5 rounded-lg bg-black/30 hover:bg-sky-900/20 border border-white/10 cursor-pointer transition-colors"
            >
              <Button
                variant="destructive" size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onRemoveNote(note.id); }}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-start gap-3">
                <div className="mt-1">{getNoteIcon(note.type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-200 mb-1 truncate">{note.title}</h4>
                  {note.type === 'image' && note.imgHref && (
                    <img src={note.imgHref} alt={note.title} className="rounded-md mt-1 mb-2 border border-white/10" />
                  )}
                  {note.body && <p className="text-xs text-slate-400 break-words line-clamp-3">{note.body}</p>}
                  {note.type === 'reference' && note.url && <p className="text-xs text-emerald-400 truncate">{note.url}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}