'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface LoveNote {
  _id: string;
  senderUsername: string;
  senderDisplay: string;
  message: string;
  opened: boolean;
  openedAt: string | null;
  createdAt: string;
}

export default function LoveJarPage() {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username;
  const displayName = username === 'efo' ? 'Efo' : 'Daavi';
  const partnerName = username === 'efo' ? 'Daavi' : 'Efo';

  const [myNotes, setMyNotes] = useState<LoveNote[]>([]);
  const [partnerNotes, setPartnerNotes] = useState<LoveNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [revealedNote, setRevealedNote] = useState<LoveNote | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [activeTab, setActiveTab] = useState<'partner' | 'mine'>('partner');

  const loadNotes = useCallback(async () => {
    try {
      const r = await fetch('/api/love-jar');
      if (!r.ok) return;
      const data = await r.json();
      setMyNotes(data.myNotes || []);
      setPartnerNotes(data.partnerNotes || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    const t = setInterval(loadNotes, 5000);
    return () => clearInterval(t);
  }, [loadNotes]);

  const unopenedNotes = partnerNotes.filter(n => !n.opened);

  async function openNote() {
    if (unopenedNotes.length === 0) return;
    // Pick oldest unopened
    const oldest = unopenedNotes[unopenedNotes.length - 1];
    setRevealing(true);
    try {
      const r = await fetch('/api/love-jar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: oldest._id }),
      });
      if (!r.ok) {
        toast.error('Could not open note');
        setRevealing(false);
        return;
      }
      const updated = await r.json();
      setRevealedNote(updated);
      await loadNotes();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setRevealing(false);
    }
  }

  async function addNote() {
    if (!message.trim()) return toast.error('Write something first! 💕');
    setPosting(true);
    try {
      const r = await fetch('/api/love-jar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!r.ok) {
        toast.error('Could not add note');
        return;
      }
      setMessage('');
      setShowAddForm(false);
      await loadNotes();
      toast.success(`Note added to ${partnerName}'s jar! 🫙`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">🫙</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider uppercase">Secret Notes</div>
        <div className="text-7xl mb-2 drop-shadow-sm">🫙</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-1">Love Jar</h1>
        <p className="text-gray-500 text-sm">
          {unopenedNotes.length > 0
            ? <span className="text-rose-500 font-semibold">{unopenedNotes.length} unopened {unopenedNotes.length === 1 ? 'note' : 'notes'} from {partnerName} 💌</span>
            : `Notes from ${partnerName} waiting here`}
        </p>
      </div>

      {/* Revealed note modal */}
      {revealedNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setRevealedNote(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full text-center animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">💌</div>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3">From {partnerName}</p>
            <p className="text-gray-800 text-lg leading-relaxed font-medium italic">&ldquo;{revealedNote.message}&rdquo;</p>
            <p className="text-xs text-gray-400 mt-4">{formatDistanceToNow(new Date(revealedNote.createdAt), { addSuffix: true })}</p>
            <button
              onClick={() => setRevealedNote(null)}
              className="mt-5 w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
            >
              Close with love 💕
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={openNote}
          disabled={unopenedNotes.length === 0 || revealing}
          className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {revealing ? '✨ Opening...' : unopenedNotes.length === 0 ? 'Jar is empty 🫙' : 'Open a Note ✉️'}
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-3.5 px-5 bg-white border-2 border-rose-200 text-rose-500 rounded-2xl font-bold text-sm active:scale-95 transition-all hover:bg-rose-50"
        >
          {showAddForm ? '✕' : 'Add to Jar +'}
        </button>
      </div>

      {/* Empty jar message */}
      {unopenedNotes.length === 0 && partnerNotes.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-5 text-center mb-5">
          <div className="text-3xl mb-2">💝</div>
          <p className="text-sm font-semibold text-rose-700">Your jar is empty for now</p>
          <p className="text-xs text-rose-400 mt-1">All notes have been opened — more to come!</p>
        </div>
      )}

      {/* Add note form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-lg p-4 mb-5 animate-scale-in">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3">Write a note for {partnerName}</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 150))}
            rows={4}
            placeholder={`Something sweet for ${partnerName}...`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-2 mb-3">
            <span className={`text-xs ${message.length >= 140 ? 'text-rose-500' : 'text-gray-400'}`}>
              {message.length}/150
            </span>
          </div>
          <button
            onClick={addNote}
            disabled={posting || !message.trim()}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-60"
          >
            {posting ? 'Adding...' : 'Drop into Jar 🫙'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab('partner')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'partner' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}
        >
          From {partnerName} ({partnerNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'mine' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}
        >
          From {displayName} ({myNotes.length})
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {activeTab === 'partner' && (
          <>
            {partnerNotes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🫙</div>
                <p className="text-sm font-medium">No notes from {partnerName} yet</p>
              </div>
            )}
            {partnerNotes.map((note, i) => (
              <div
                key={note._id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all animate-fade-in ${note.opened ? 'border-gray-100' : 'border-rose-200 bg-gradient-to-br from-white to-rose-50'}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{note.opened ? '💌' : '📮'}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${note.opened ? 'bg-gray-100 text-gray-500' : 'bg-rose-100 text-rose-600'}`}>
                      {note.opened ? 'Opened' : 'Unopened'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                </div>
                {note.opened ? (
                  <p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;{note.message}&rdquo;</p>
                ) : (
                  <p className="text-gray-400 text-sm italic">Tap &ldquo;Open a Note&rdquo; to reveal...</p>
                )}
                {note.opened && note.openedAt && (
                  <p className="text-xs text-gray-400 mt-2">Opened {formatDistanceToNow(new Date(note.openedAt), { addSuffix: true })}</p>
                )}
              </div>
            ))}
          </>
        )}

        {activeTab === 'mine' && (
          <>
            {myNotes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">💕</div>
                <p className="text-sm font-medium">You haven&apos;t added any notes yet</p>
                <p className="text-xs mt-1">Tap &ldquo;Add to Jar +&rdquo; above to write one!</p>
              </div>
            )}
            {myNotes.map((note, i) => (
              <div
                key={note._id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{note.opened ? '💌' : '🫙'}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${note.opened ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {note.opened ? `Opened by ${partnerName}` : 'Waiting to be opened'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;{note.message}&rdquo;</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer decoration */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">Every note is a little piece of your heart 💕</p>
      </div>
    </div>
  );
}
