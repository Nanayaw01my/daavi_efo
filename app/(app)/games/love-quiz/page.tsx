'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LOVE_QUIZ_QUESTIONS } from '@/lib/questions';
import toast from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';

export default function LoveQuizPage() {
  const { data: session } = useSession();
  const [dbAnswers, setDbAnswers] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const username = (session?.user as any)?.username;
  const partnerName = username === 'efo' ? 'Daavi' : 'Efo';

  useEffect(() => {
    fetch('/api/games/love-quiz').then(r => r.json()).then(setDbAnswers);
  }, []);

  const q = LOVE_QUIZ_QUESTIONS[idx];
  const dbQ = dbAnswers.find(a => a.questionId === q?.id);
  const myField = username === 'efo' ? 'efoAnswer' : 'daaviAnswer';
  const partnerField = username === 'efo' ? 'daaviAnswer' : 'efoAnswer';
  const myAnswer = dbQ?.[myField] ?? -1;
  const partnerAnswer = dbQ?.[partnerField] ?? -1;

  const myAnswered = dbAnswers.filter(a => a[myField] >= 0).length;
  const partnerAnswered = dbAnswers.filter(a => a[partnerField] >= 0).length;
  const bothAnswered = dbAnswers.filter(a => a.efoAnswer >= 0 && a.daaviAnswer >= 0);
  const matchCount = bothAnswered.filter(a => a.efoAnswer === a.daaviAnswer).length;

  async function pick(optIdx: number) {
    if (saving) return;
    setSaving(true);
    const res = await fetch('/api/games/love-quiz', {
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
    if (idx < LOVE_QUIZ_QUESTIONS.length - 1) setTimeout(() => setIdx(i => i + 1), 400);
    else setShowResults(true);
  }

  async function reset() {
    await fetch('/api/games/love-quiz', { method: 'DELETE' });
    setDbAnswers([]); setIdx(0); setShowResults(false);
    toast.success('Quiz reset!');
  }

  const canSeeResults = myAnswered === LOVE_QUIZ_QUESTIONS.length && partnerAnswered === LOVE_QUIZ_QUESTIONS.length;
  const pct = LOVE_QUIZ_QUESTIONS.length > 0 ? Math.round((matchCount / LOVE_QUIZ_QUESTIONS.length) * 100) : 0;

  if (showResults && canSeeResults) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto">
        {/* Score card */}
        <div className={`rounded-3xl p-6 text-white text-center mb-5 ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : pct >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-rose-400 to-violet-500'}`}>
          <div className="text-5xl mb-2">💕</div>
          <div className="font-playfair text-4xl font-bold mb-1">{pct}% Compatible</div>
          <p className="text-white/80 text-sm">You matched on {matchCount}/{LOVE_QUIZ_QUESTIONS.length} love style questions</p>
          <div className="mt-3 text-sm font-medium text-white/90">
            {pct >= 80 ? '🏆 Beautifully aligned — you just get each other.' : pct >= 60 ? '💛 Great compatibility with beautiful differences.' : '🌱 Different styles that complement each other!'}
          </div>
        </div>

        {/* Question breakdown */}
        <div className="space-y-3 mb-5">
          {LOVE_QUIZ_QUESTIONS.map(q => {
            const dbQ = dbAnswers.find(a => a.questionId === q.id);
            const efoA = dbQ?.efoAnswer ?? -1;
            const daaviA = dbQ?.daaviAnswer ?? -1;
            const match = efoA >= 0 && daaviA >= 0 && efoA === daaviA;
            return (
              <div key={q.id} className={`bg-white rounded-2xl border p-4 ${match ? 'border-emerald-200' : 'border-gray-100'}`}>
                <p className="text-sm font-semibold text-gray-800 mb-3">{q.question}</p>
                <div className="space-y-2">
                  {efoA >= 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-rose-500 w-8 flex-shrink-0">Efo</span>
                      <span className="text-xs text-gray-700 bg-rose-50 px-2 py-1 rounded-lg flex-1">{q.options[efoA]}</span>
                    </div>
                  )}
                  {daaviA >= 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-violet-500 w-8 flex-shrink-0">Daavi</span>
                      <span className="text-xs text-gray-700 bg-violet-50 px-2 py-1 rounded-lg flex-1">{q.options[daaviA]}</span>
                    </div>
                  )}
                  {match && <div className="text-xs text-emerald-600 font-bold text-center mt-1">✅ You match!</div>}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={reset} className="w-full py-4 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <RotateCcw size={18} /> Retake Quiz
        </button>
      </div>
    );
  }

  if (showResults && !canSeeResults) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Waiting for {partnerName}...</h2>
          <p className="text-gray-500 text-sm mb-4">You&apos;ve finished! {partnerName} has answered {partnerAnswered}/{LOVE_QUIZ_QUESTIONS.length} questions.</p>
          <p className="text-amber-600 font-medium text-sm">Results will unlock when both of you have answered all questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Love Quiz</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Compatibility Quiz 💝</h1>
        <p className="text-gray-500 text-sm mt-1">Answer independently. Results reveal only when both finish.</p>
      </div>

      {/* Status bars */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3">
          <div className="text-xs font-bold text-rose-500 mb-1">🌸 Efo</div>
          <div className="w-full bg-rose-100 rounded-full h-1.5 mb-1">
            <div className="bg-rose-400 h-1.5 rounded-full transition-all" style={{ width: `${((username === 'efo' ? myAnswered : partnerAnswered) / LOVE_QUIZ_QUESTIONS.length) * 100}%` }} />
          </div>
          <div className="text-xs text-rose-600 font-medium">{username === 'efo' ? myAnswered : partnerAnswered}/{LOVE_QUIZ_QUESTIONS.length}</div>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3">
          <div className="text-xs font-bold text-violet-500 mb-1">⭐ Daavi</div>
          <div className="w-full bg-violet-100 rounded-full h-1.5 mb-1">
            <div className="bg-violet-400 h-1.5 rounded-full transition-all" style={{ width: `${((username === 'daavi' ? myAnswered : partnerAnswered) / LOVE_QUIZ_QUESTIONS.length) * 100}%` }} />
          </div>
          <div className="text-xs text-violet-600 font-medium">{username === 'daavi' ? myAnswered : partnerAnswered}/{LOVE_QUIZ_QUESTIONS.length}</div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {LOVE_QUIZ_QUESTIONS.map((_, i) => {
          const dbQ2 = dbAnswers.find(a => a.questionId === LOVE_QUIZ_QUESTIONS[i].id);
          const mine = dbQ2?.[myField] ?? -1;
          return (
            <button key={i} onClick={() => setIdx(i)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${i === idx ? 'ring-2 ring-rose-400 ring-offset-1' : ''} ${mine >= 0 ? 'bg-gradient-to-br from-rose-400 to-violet-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5 animate-scale-in">
        <div className="text-center text-xs font-bold text-pink-400 mb-3 uppercase tracking-wider">Question {idx + 1} of {LOVE_QUIZ_QUESTIONS.length}</div>
        <p className="font-playfair text-lg font-semibold text-gray-900 mb-5 text-center leading-snug">{q.question}</p>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={saving}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                myAnswer === i ? 'border-rose-400 bg-rose-50 shadow-md shadow-rose-100'
                : 'border-gray-100 bg-gray-50 hover:border-pink-200 hover:bg-pink-50/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${myAnswer === i ? 'bg-rose-400 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                <span className="text-sm text-gray-800">{opt}</span>
                {myAnswer === i && <span className="ml-auto text-rose-400">✓</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold disabled:opacity-40">← Prev</button>
        <button onClick={() => idx < LOVE_QUIZ_QUESTIONS.length - 1 ? setIdx(i => i + 1) : setShowResults(true)} className="flex-1 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-xl font-bold shadow-md">
          {idx < LOVE_QUIZ_QUESTIONS.length - 1 ? 'Next →' : 'Finish 💕'}
        </button>
      </div>
    </div>
  );
}
