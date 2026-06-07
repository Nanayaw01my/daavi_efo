'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MEMORY_CHALLENGE_QUESTIONS } from '@/lib/questions';
import toast from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';

export default function MemoryChallengePage() {
  const { data: session } = useSession();
  const [dbAnswers, setDbAnswers] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const username = (session?.user as any)?.username;
  const partnerName = username === 'efo' ? 'Daavi' : 'Efo';

  useEffect(() => {
    fetch('/api/games/memory-challenge').then(r => r.json()).then(setDbAnswers);
  }, []);

  const q = MEMORY_CHALLENGE_QUESTIONS[idx];
  const dbQ = dbAnswers.find(a => a.questionId === q?.id);
  const myField = username === 'efo' ? 'efoAnswer' : 'daaviAnswer';
  const partnerField = username === 'efo' ? 'daaviAnswer' : 'efoAnswer';
  const myAnswer = dbQ?.[myField] ?? -1;
  const partnerAnswer = dbQ?.[partnerField] ?? -1;

  const myAnswered = dbAnswers.filter(a => a[myField] >= 0).length;
  const partnerAnswered = dbAnswers.filter(a => a[partnerField] >= 0).length;
  const bothDone = myAnswered === MEMORY_CHALLENGE_QUESTIONS.length && partnerAnswered === MEMORY_CHALLENGE_QUESTIONS.length;
  const matchCount = dbAnswers.filter(a => a.efoAnswer >= 0 && a.daaviAnswer >= 0 && a.efoAnswer === a.daaviAnswer).length;

  async function pick(optIdx: number) {
    if (saving) return;
    setSaving(true);
    const res = await fetch('/api/games/memory-challenge', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, answer: optIdx }),
    });
    const updated = await res.json();
    setDbAnswers(prev => {
      const exists = prev.find(a => a.questionId === updated.questionId);
      return exists ? prev.map(a => a.questionId === updated.questionId ? updated : a) : [...prev, updated];
    });
    setSaving(false);
    if (idx < MEMORY_CHALLENGE_QUESTIONS.length - 1) setTimeout(() => setIdx(i => i + 1), 400);
    else setShowResults(true);
  }

  async function reset() {
    await fetch('/api/games/memory-challenge', { method: 'DELETE' });
    setDbAnswers([]); setIdx(0); setShowResults(false);
    toast.success('Challenge reset!');
  }

  const pct = MEMORY_CHALLENGE_QUESTIONS.length > 0 ? Math.round((matchCount / MEMORY_CHALLENGE_QUESTIONS.length) * 100) : 0;

  if (showResults && bothDone) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto">
        <div className={`rounded-3xl p-6 text-white text-center mb-5 ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
          <div className="text-5xl mb-2">🏆</div>
          <div className="font-playfair text-4xl font-bold mb-1">{pct}%</div>
          <p className="text-white/80 text-sm">You knew each other on {matchCount}/{MEMORY_CHALLENGE_QUESTIONS.length} questions</p>
          <div className="mt-3 text-sm font-medium text-white/90">
            {pct >= 80 ? '🧠 You know each other incredibly deeply!' : pct >= 60 ? '💕 Great — you pay close attention to each other!' : '🌱 Fun to discover where you surprised each other!'}
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {MEMORY_CHALLENGE_QUESTIONS.map(q => {
            const dbQ = dbAnswers.find(a => a.questionId === q.id);
            const efoA = dbQ?.efoAnswer ?? -1;
            const daaviA = dbQ?.daaviAnswer ?? -1;
            const match = efoA >= 0 && daaviA >= 0 && efoA === daaviA;
            return (
              <div key={q.id} className={`bg-white rounded-2xl border p-4 ${match ? 'border-emerald-200' : 'border-gray-100'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base flex-shrink-0">{match ? '✅' : '🔀'}</span>
                  <p className="text-sm font-semibold text-gray-800">{q.question}</p>
                </div>
                <div className="space-y-1.5">
                  {efoA >= 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-rose-500 w-7 flex-shrink-0">Efo</span>
                      <span className="text-xs text-gray-700 bg-rose-50 px-2 py-1 rounded-lg">{q.options[efoA]}</span>
                    </div>
                  )}
                  {daaviA >= 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-violet-500 w-7 flex-shrink-0">Daavi</span>
                      <span className="text-xs text-gray-700 bg-violet-50 px-2 py-1 rounded-lg">{q.options[daaviA]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={reset} className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <RotateCcw size={18} /> Play Again
        </button>
      </div>
    );
  }

  if (showResults && !bothDone) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto text-center">
        <div className="bg-violet-50 border border-violet-200 rounded-3xl p-8">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Great job — now wait for {partnerName}!</h2>
          <p className="text-gray-500 text-sm">{partnerName} has answered {partnerAnswered}/{MEMORY_CHALLENGE_QUESTIONS.length} questions.</p>
          <p className="text-violet-600 font-medium text-sm mt-3">Results unlock when both of you finish.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-violet-100 text-violet-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Memory Challenge</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">How Well Do You Know Me? 🏆</h1>
        <p className="text-gray-500 text-sm mt-1">Answer about <strong>yourself</strong>. Your partner answers about themselves. Then compare!</p>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
          <div className="text-xs font-bold text-rose-400 mb-1">🌸 Efo</div>
          <div className="text-lg font-black text-rose-500">{username === 'efo' ? myAnswered : partnerAnswered}<span className="text-xs font-normal">/{MEMORY_CHALLENGE_QUESTIONS.length}</span></div>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
          <div className="text-xs font-bold text-violet-400 mb-1">⭐ Daavi</div>
          <div className="text-lg font-black text-violet-500">{username === 'daavi' ? myAnswered : partnerAnswered}<span className="text-xs font-normal">/{MEMORY_CHALLENGE_QUESTIONS.length}</span></div>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5 animate-scale-in">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{idx + 1} / {MEMORY_CHALLENGE_QUESTIONS.length}</span>
          {myAnswer >= 0 && <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-bold">✓ Answered</span>}
        </div>

        <p className="font-playfair text-lg font-semibold text-gray-900 mb-5 leading-snug">{q.question}</p>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isMine = myAnswer === i;
            const isPartner = partnerAnswer === i && partnerAnswer >= 0;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={saving}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                  isMine && isPartner ? 'border-emerald-400 bg-emerald-50'
                  : isMine ? 'border-violet-400 bg-violet-50 shadow-md shadow-violet-100'
                  : isPartner ? 'border-rose-300 bg-rose-50'
                  : 'border-gray-100 bg-gray-50 hover:border-violet-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isMine ? 'bg-violet-400 text-white' : isPartner ? 'bg-rose-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm text-gray-800 flex-1">{opt}</span>
                  <div className="flex gap-1">
                    {isMine && <span className="text-[10px] bg-violet-100 text-violet-500 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                    {isPartner && <span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-bold">{partnerName}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold disabled:opacity-40">← Prev</button>
        <button onClick={() => idx < MEMORY_CHALLENGE_QUESTIONS.length - 1 ? setIdx(i => i + 1) : setShowResults(true)} className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-bold shadow-md">
          {idx < MEMORY_CHALLENGE_QUESTIONS.length - 1 ? 'Next →' : 'Finish 🏆'}
        </button>
      </div>
    </div>
  );
}
