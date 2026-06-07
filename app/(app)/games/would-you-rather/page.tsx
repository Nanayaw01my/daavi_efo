'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function WouldYouRatherPage() {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const username = (session?.user as any)?.username;

  useEffect(() => {
    fetch('/api/games/would-you-rather').then(r => r.json()).then(setQuestions);
  }, []);

  const q = questions[idx];
  if (!q) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const myChoice = username === 'efo' ? q.efoChoice : q.daaviChoice;
  const partnerChoice = username === 'efo' ? q.daaviChoice : q.efoChoice;
  const partnerName = username === 'efo' ? 'Daavi' : 'Efo';

  async function choose(choice: 'A' | 'B') {
    setSaving(true);
    const res = await fetch('/api/games/would-you-rather', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: q.questionId, choice }) });
    const updated = await res.json();
    setQuestions(qs => qs.map(x => x.questionId === updated.questionId ? updated : x));
    setSaving(false);
    toast.success('Choice saved! 💕');
  }

  const answered = questions.filter(q => q.efoChoice || q.daaviChoice).length;
  const both = questions.filter(q => q.efoChoice && q.daaviChoice).length;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Would You Rather</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Would You Rather 🤔</h1>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span>{answered}/{questions.length} answered</span>
          <span>·</span>
          <span>{both} both answered</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-5">
        {questions.map((q, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`flex-1 h-1.5 rounded-full transition-all ${i === idx ? 'bg-amber-400' : (q.efoChoice && q.daaviChoice) ? 'bg-gradient-to-r from-rose-400 to-violet-400' : (q.efoChoice || q.daaviChoice) ? 'bg-amber-300' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-amber-100 shadow-xl shadow-amber-50 p-6 animate-scale-in">
        <div className="text-center text-sm font-bold text-amber-500 mb-2">Question {idx + 1} of {questions.length}</div>
        <h2 className="font-playfair text-xl font-bold text-gray-900 text-center mb-6">Would you rather...</h2>

        <div className="space-y-3">
          {(['A', 'B'] as const).map(opt => {
            const text = opt === 'A' ? q.optionA : q.optionB;
            const isMine = myChoice === opt;
            const isPartner = partnerChoice === opt;
            return (
              <button
                key={opt}
                onClick={() => choose(opt)}
                disabled={saving}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                  isMine ? 'border-rose-400 bg-rose-50' : isPartner ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-gray-50 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${isMine ? 'bg-rose-400 text-white' : isPartner ? 'bg-violet-400 text-white' : 'bg-gray-200 text-gray-600'}`}>{opt}</span>
                  <span className="text-sm font-medium text-gray-800 flex-1">{text}</span>
                  <div className="flex gap-1">
                    {isMine && <span className="text-xs bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                    {isPartner && <span className="text-xs bg-violet-100 text-violet-500 px-1.5 py-0.5 rounded-full font-bold">{partnerName}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {myChoice && partnerChoice && (
          <div className={`mt-4 p-3 rounded-xl text-center text-sm font-semibold ${myChoice === partnerChoice ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            {myChoice === partnerChoice ? '💚 You both agree!' : '🔀 You chose differently!'}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 py-3.5 border border-gray-200 rounded-xl text-gray-600 font-bold disabled:opacity-40">← Prev</button>
        <button onClick={() => setIdx(i => Math.min(questions.length - 1, i + 1))} disabled={idx === questions.length - 1} className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl font-bold shadow-md shadow-amber-100">Next →</button>
      </div>
    </div>
  );
}
