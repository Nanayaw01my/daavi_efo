'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

const TYPES = [
  { value: 'message', label: '💝 Message', color: 'rose' },
  { value: 'reminder', label: '📅 Reminder', color: 'amber' },
  { value: 'goal', label: '🎯 Goal', color: 'emerald' },
  { value: 'idea', label: '💡 Idea', color: 'violet' },
  { value: 'memory', label: '🎵 Memory', color: 'blue' },
];

const TYPE_COLORS: Record<string, string> = {
  message: 'bg-rose-100 text-rose-600 border-rose-200',
  reminder: 'bg-amber-100 text-amber-600 border-amber-200',
  goal: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  idea: 'bg-violet-100 text-violet-600 border-violet-200',
  memory: 'bg-blue-100 text-blue-600 border-blue-200',
};

export default function NotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [type, setType] = useState('message');
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const username = (session?.user as any)?.username;
  const role = (session?.user as any)?.role;

  useEffect(() => {
    loadNotes();
    const t = setInterval(loadNotes, 10000);
    return () => clearInterval(t);
  }, []);

  async function loadNotes() {
    const r = await fetch('/api/notes');
    const data = await r.json();
    setNotes(data);
  }

  async function post() {
    if (!content.trim()) return toast.error('Write something!');
    setPosting(true);
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, type }) });
    setContent('');
    setShowForm(false);
    await loadNotes();
    setPosting(false);
    toast.success('Note posted! 💕');
  }

  async function remove(id: string) {
    await fetch('/api/notes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotes(n => n.filter(x => x._id !== id));
    toast.success('Deleted');
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-1 tracking-wider uppercase">Shared Board</div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Our Notes 💌</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="w-12 h-12 bg-gradient-to-br from-rose-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg active:scale-95 transition-all">
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* New note form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-lg p-4 mb-4 animate-scale-in">
          <div className="flex gap-2 flex-wrap mb-3">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)} className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${type === t.value ? TYPE_COLORS[t.value] : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            placeholder="Write something for your partner..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
          />
          <button onClick={post} disabled={posting} className="w-full mt-3 py-3 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-60">
            {posting ? 'Posting...' : 'Post Note 💕'}
          </button>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">💌</div>
            <p className="font-medium">No notes yet. Leave the first one!</p>
          </div>
        )}
        {notes.map((note, i) => (
          <div key={note._id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-fade-in card-hover`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{note.authorDisplay}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[note.type] || TYPE_COLORS.message}`}>
                  {TYPES.find(t => t.value === note.type)?.label || note.type}
                </span>
              </div>
              {(note.author === username || role === 'admin') && (
                <button onClick={() => remove(note._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-gray-400 mt-2">{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
