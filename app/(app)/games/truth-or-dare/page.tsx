'use client';
import { useState } from 'react';
import { TRUTH_PROMPTS, DARE_PROMPTS } from '@/lib/questions';
import toast from 'react-hot-toast';

export default function TruthOrDarePage() {
  const [type, setType] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<Array<{ type: string; prompt: string; response: string }>>([]);
  const [showing, setShowing] = useState(false);

  function draw(t: 'truth' | 'dare') {
    setType(t);
    const pool = t === 'truth' ? TRUTH_PROMPTS : DARE_PROMPTS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setPrompt(pick);
    setResponse('');
    setShowing(true);
  }

  function save() {
    if (!response.trim()) return toast.error('Write a response first!');
    setHistory(h => [{ type: type!, prompt, response }, ...h]);
    setResponse('');
    setShowing(false);
    toast.success('Saved! 🎭');
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-6">
        <div className="inline-block bg-violet-100 text-violet-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Truth or Dare</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Truth or Dare 🎭</h1>
        <p className="text-gray-500 text-sm mt-1">Couples edition — honest, deep, and fun.</p>
      </div>

      {!showing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => draw('truth')} className="py-10 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-3xl font-bold text-xl shadow-xl shadow-violet-200 active:scale-95 transition-all">
              <div className="text-4xl mb-2">🔮</div>
              Truth
            </button>
            <button onClick={() => draw('dare')} className="py-10 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl font-bold text-xl shadow-xl shadow-rose-200 active:scale-95 transition-all">
              <div className="text-4xl mb-2">🔥</div>
              Dare
            </button>
          </div>
          <p className="text-center text-sm text-gray-400">Tap to draw a card</p>

          {history.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-gray-700 mb-3 text-sm">This Session</h2>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${h.type === 'truth' ? 'border-violet-100 bg-violet-50' : 'border-rose-100 bg-rose-50'}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${h.type === 'truth' ? 'text-violet-500' : 'text-rose-500'}`}>{h.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}</div>
                    <p className="text-sm text-gray-700 italic mb-2">&ldquo;{h.prompt}&rdquo;</p>
                    <p className="text-sm text-gray-600 font-medium">{h.response}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`bg-white rounded-3xl border shadow-xl p-6 animate-scale-in ${type === 'truth' ? 'border-violet-100 shadow-violet-100' : 'border-rose-100 shadow-rose-100'}`}>
          <div className={`text-5xl text-center mb-4`}>{type === 'truth' ? '🔮' : '🔥'}</div>
          <div className={`text-center text-xs font-bold uppercase tracking-widest mb-3 ${type === 'truth' ? 'text-violet-500' : 'text-rose-500'}`}>{type}</div>
          <p className="font-playfair text-xl font-semibold text-gray-900 italic text-center leading-snug mb-6">&ldquo;{prompt}&rdquo;</p>

          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            rows={4}
            placeholder="Your response..."
            className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm resize-none transition-all focus:ring-2 ${type === 'truth' ? 'border-violet-200 focus:border-violet-400 focus:ring-violet-100' : 'border-rose-200 focus:border-rose-400 focus:ring-rose-100'}`}
          />

          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm">Skip</button>
            <button onClick={save} className={`flex-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all ${type === 'truth' ? 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-violet-200' : 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-200'}`}>
              Save 💕
            </button>
            <button onClick={() => draw(type!)} className="flex-1 py-3 bg-gray-100 rounded-xl text-gray-600 font-semibold text-sm">
              Re-draw
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
