'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Round {
  _id: string;
  roundNumber: number;
  asker: string;
  responder: string;
  type: 'truth' | 'dare' | null;
  prompt: string | null;
  response: string;
  status: 'choosing' | 'answering' | 'done';
  createdAt: string;
}

function displayName(username: string) {
  return username === 'efo' ? 'Efo' : 'Daavi';
}

function partnerOf(username: string) {
  return username === 'efo' ? 'Daavi' : 'Efo';
}

export default function TruthOrDarePage() {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username as string | undefined;

  const [current, setCurrent] = useState<Round | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/games/truth-or-dare');
      if (!res.ok) return;
      const data = await res.json();
      setCurrent(data.current ?? null);
      setHistory(data.history ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 4000);
    return () => clearInterval(interval);
  }, [fetchState]);

  async function doAction(body: object) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/truth-or-dare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      await fetchState();
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStart() {
    await doAction({ action: 'start' });
  }

  async function handleChoose(type: 'truth' | 'dare') {
    await doAction({ action: 'choose', type });
  }

  async function handleRespond() {
    if (!responseText.trim()) {
      toast.error('Write your response first!');
      return;
    }
    await doAction({ action: 'respond', response: responseText.trim() });
    setResponseText('');
    toast.success('Response sent! 🎉');
  }

  async function handleReset() {
    if (!confirm('Reset the entire game? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await fetch('/api/games/truth-or-dare', { method: 'DELETE' });
      setCurrent(null);
      setHistory([]);
      toast.success('Game reset!');
    } catch {
      toast.error('Failed to reset');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !username) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">🎭</div>
      </div>
    );
  }

  const isAsker = current?.asker === username;
  const isResponder = current?.responder === username;
  const partner = partnerOf(username);
  const myDisplay = displayName(username);
  const askerDisplay = current ? displayName(current.asker) : '';
  const responderDisplay = current ? displayName(current.responder) : '';

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">
          Truth or Dare
        </div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Truth or Dare 🎭</h1>
        <p className="text-gray-500 text-sm mt-1">Couples edition — honest, deep, and daring.</p>
      </div>

      {/* ── STATE 1: No active game ── */}
      {!current && (
        <div className="text-center py-10">
          <div className="text-7xl mb-6">🎴</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No game in progress</h2>
          <p className="text-gray-500 text-sm mb-8">
            Start a game — you'll be asking {partner} first!
          </p>
          <button
            onClick={handleStart}
            disabled={submitting}
            className="px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            Start Game 🎭
          </button>
        </div>
      )}

      {/* ── STATE 2: You're the ASKER, status='choosing' ── */}
      {current?.status === 'choosing' && isAsker && (
        <div className="text-center">
          <div className="mb-4">
            <span className="inline-block bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase">
              {myDisplay}'s Turn to Ask
            </span>
          </div>
          <div className="text-5xl mb-4">🤔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Ask {responderDisplay}: Truth or Dare?
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Choose what you want to give them — Round {current.roundNumber}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleChoose('truth')}
              disabled={submitting}
              className="py-10 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-3xl font-bold text-xl shadow-xl shadow-gray-300 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🔮</div>
              Truth
            </button>
            <button
              onClick={() => handleChoose('dare')}
              disabled={submitting}
              className="py-10 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl font-bold text-xl shadow-xl shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🔥</div>
              Dare
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 3: You're the RESPONDER, status='choosing' ── */}
      {current?.status === 'choosing' && isResponder && (
        <div className="text-center py-10">
          <div className="relative inline-block mb-6">
            <div className="text-7xl animate-bounce">⏳</div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Waiting for {askerDisplay}...
          </h2>
          <p className="text-gray-500 text-sm">
            {askerDisplay} is deciding what to ask you — Truth or Dare?
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* ── STATE 4: You're the RESPONDER, status='answering' ── */}
      {current?.status === 'answering' && isResponder && (
        <div>
          <div className="mb-4 flex justify-center">
            <span className="inline-block bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase">
              {myDisplay}'s Turn to Answer
            </span>
          </div>

          <div className={`bg-white rounded-3xl border shadow-xl p-6 mb-5 ${current.type === 'truth' ? 'border-gray-200 shadow-gray-100' : 'border-rose-100 shadow-rose-100'}`}>
            <div className="text-5xl text-center mb-3">
              {current.type === 'truth' ? '🔮' : '🔥'}
            </div>
            <div className={`text-center text-xs font-bold uppercase tracking-widest mb-4 ${current.type === 'truth' ? 'text-gray-700' : 'text-rose-500'}`}>
              {current.type === 'truth' ? 'Truth' : 'Dare'} — from {askerDisplay}
            </div>
            <p className="font-playfair text-xl font-semibold text-gray-900 italic text-center leading-snug">
              &ldquo;{current.prompt}&rdquo;
            </p>
          </div>

          <textarea
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
            rows={4}
            placeholder="Your response..."
            className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm resize-none transition-all focus:outline-none focus:ring-2 ${current.type === 'truth' ? 'border-gray-200 focus:border-gray-400 focus:ring-gray-100' : 'border-rose-200 focus:border-rose-400 focus:ring-rose-100'}`}
          />

          <button
            onClick={handleRespond}
            disabled={submitting || !responseText.trim()}
            className={`mt-4 w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-95 transition-all disabled:opacity-50 ${current.type === 'truth' ? 'bg-gradient-to-r from-gray-900 to-gray-700 shadow-gray-300' : 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-200'}`}
          >
            Send Response 💕
          </button>
        </div>
      )}

      {/* ── STATE 5: You're the ASKER, status='answering' ── */}
      {current?.status === 'answering' && isAsker && (
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase ${current.type === 'truth' ? 'bg-gray-900 text-white' : 'bg-rose-500 text-white'}`}>
              {current.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 mb-6 text-left">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">You asked {responderDisplay}:</p>
            <p className="font-playfair text-lg font-semibold text-gray-900 italic leading-snug">
              &ldquo;{current.prompt}&rdquo;
            </p>
          </div>

          <div className="text-5xl mb-4 animate-pulse">💭</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Waiting for {responderDisplay}...
          </h2>
          <p className="text-gray-500 text-sm">
            {responderDisplay} is writing their response
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {history.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Past Rounds</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h._id}
                className={`p-4 rounded-2xl border ${h.type === 'truth' ? 'border-gray-200 bg-gray-50' : 'border-rose-100 bg-rose-50'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${h.type === 'truth' ? 'bg-gray-200 text-gray-700' : 'bg-rose-200 text-rose-700'}`}>
                    {h.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {displayName(h.asker)} asked {displayName(h.responder)} · Round {h.roundNumber}
                  </span>
                </div>
                <p className="text-sm text-gray-700 italic mb-2">&ldquo;{h.prompt}&rdquo;</p>
                {h.response && (
                  <p className="text-sm text-gray-600 font-medium bg-white rounded-xl px-3 py-2 border border-gray-100">
                    {h.response}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESET ── */}
      <div className="mt-10 pt-6 border-t border-gray-100 text-center">
        <button
          onClick={handleReset}
          disabled={submitting}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium underline underline-offset-2"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}
