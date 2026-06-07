'use client';
import { useState } from 'react';
import { THIS_OR_THAT } from '@/lib/questions';

export default function ThisOrThatPage() {
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B'>>({});
  const [idx, setIdx] = useState(0);

  const q = THIS_OR_THAT[idx];
  const myAnswer = answers[q.id];
  const done = Object.keys(answers).length;

  function choose(choice: 'A' | 'B') {
    setAnswers(a => ({ ...a, [q.id]: choice }));
    if (idx < THIS_OR_THAT.length - 1) setTimeout(() => setIdx(i => i + 1), 300);
  }

  if (done === THIS_OR_THAT.length) {
    return (
      <div className="px-4 py-10 max-w-lg mx-auto text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">All Done!</h2>
        <p className="text-gray-500 mb-6">You answered all {THIS_OR_THAT.length} questions!</p>
        <div className="space-y-3 text-left mb-6">
          {THIS_OR_THAT.map(q => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
              <span className="text-sm font-medium text-gray-600 w-6">{q.id}.</span>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${answers[q.id] === 'A' ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600'}`}>
                {answers[q.id] === 'A' ? q.a : q.b}
              </span>
            </div>
          ))}
        </div>
        <button onClick={() => { setAnswers({}); setIdx(0); }} className="px-8 py-4 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-emerald-100 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">This or That</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">This or That ⚡</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1.5 rounded-full transition-all" style={{ width: `${(done / THIS_OR_THAT.length) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-500 font-medium">{done}/{THIS_OR_THAT.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50 p-6 animate-scale-in">
        <div className="text-center text-xs font-bold text-emerald-500 mb-1 uppercase tracking-wider">Question {idx + 1}</div>
        <h2 className="font-playfair text-2xl font-bold text-gray-900 text-center mb-8">Pick one!</h2>

        <div className="flex gap-4 items-stretch">
          <button onClick={() => choose('A')} className={`flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all active:scale-95 ${myAnswer === 'A' ? 'border-rose-400 bg-rose-50 shadow-md shadow-rose-100' : 'border-gray-200 hover:border-emerald-300'}`}>
            <span className="text-3xl">{q.a.split(' ').pop()}</span>
            <span className="font-bold text-gray-800 text-sm leading-tight">{q.a}</span>
            {myAnswer === 'A' && <span className="text-xs text-rose-500 font-bold">✓ Your pick</span>}
          </button>

          <div className="flex items-center">
            <span className="text-gray-400 font-black text-lg">or</span>
          </div>

          <button onClick={() => choose('B')} className={`flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all active:scale-95 ${myAnswer === 'B' ? 'border-violet-400 bg-violet-50 shadow-md shadow-violet-100' : 'border-gray-200 hover:border-emerald-300'}`}>
            <span className="text-3xl">{q.b.split(' ').pop()}</span>
            <span className="font-bold text-gray-800 text-sm leading-tight">{q.b}</span>
            {myAnswer === 'B' && <span className="text-xs text-violet-500 font-bold">✓ Your pick</span>}
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold disabled:opacity-40">← Prev</button>
        {myAnswer && <button onClick={() => setIdx(i => Math.min(THIS_OR_THAT.length - 1, i + 1))} className="flex-1 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl font-bold shadow-md">Next →</button>}
      </div>
    </div>
  );
}
