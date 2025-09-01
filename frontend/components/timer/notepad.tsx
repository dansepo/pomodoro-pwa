import type { Note } from "../pomodoro-timer";

interface NotepadProps {
  isNotepadOpen: boolean;
  sessionNotes: Note[];
  noteContent: string;
  setNoteContent: (content: string) => void;
}

export function Notepad({
  isNotepadOpen,
  sessionNotes,
  noteContent,
  setNoteContent,
}: NotepadProps) {
  if (!isNotepadOpen) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 w-72 h-96 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl flex flex-col transition-all duration-300">
      <div className="p-3 border-b border-black/10 flex items-center justify-between">
        <h3 className="font-semibold text-sm">미니 메모장</h3>
        <span className="text-xs text-slate-500">현재 세션</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sessionNotes.map(note => (
          <div key={note.id} className="bg-white/60 p-2 rounded-md text-xs whitespace-pre-wrap break-words">
            {note.content}
          </div>
        ))}
      </div>
      <textarea
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="새 메모..."
        className="w-full h-24 bg-transparent border-t border-black/10 resize-none focus:ring-0 p-3 text-sm placeholder:text-slate-500"
      />
    </div>
  );
}
