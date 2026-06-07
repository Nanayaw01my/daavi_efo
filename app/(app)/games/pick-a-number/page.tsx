'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const CAT_COLORS: Record<string, string> = {
  Romantic: 'bg-rose-100 text-rose-600',
  Deep: 'bg-violet-100 text-violet-600',
  Appreciation: 'bg-amber-100 text-amber-600',
  'Future Goals': 'bg-emerald-100 text-emerald-600',
  Funny: 'bg-orange-100 text-orange-600',
  Growth: 'bg-blue-100 text-blue-600',
};

const CAT_ICONS: Record<string, string> = {
  Romantic: '💕', Deep: '🔮', Appreciation: '🙏', 'Future Goals': '🌍', Funny: '😄', Growth: '📈',
};

export default function PickANumberPage() {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [myAnswer, setMyAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const username = (session?.user as any)?.username;

  useEffect(() => {
    fetch('/api/games/pick-a-number').then(r => r.json()).then(setQuestions);
  }, []);

  function selectNumber(q: any) {
    setSelected(q);
    setMyAnswer(username === 'efo' ? q.efoAnswer : q.daaviAnswer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveAnswer() {
    if (!myAnswer.trim()) return toast.error('Please write your answer.');
    setSaving(true);
    const body: any = { number: selected.number };
    if (username === 'efo') body.efoAnswer = myAnswer;
    else body.daaviAnswer = myAnswer;

    const res = await fetch('/api/games/pick-a-number', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const updated = await res.json();
    setQuestions(qs => qs.map(q => q.number === updated.number ? updated : q));
    setSelected(updated);
    setSaving(false);
    toast.success('Answer saved! 💕');
  }

  const answered = questions.filter(q => q.isAnswered).length;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Pick A Number</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Choose Your Number 🔢</h1>
        <p className="text-gray-500 text-sm mt-1">{answered}/50 questions answered together</p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
          <div className="bg-gradient-to-r from-rose-400 to-violet-400 h-1.5 rounded-full transition-all" style={{ width: `${(answered / 50) * 100}%` }} />
        </div>
      </div>

      {/* Selected question */}
      {selected && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-md p-5 mb-5 animate-scale-in">
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-3 ${CAT_COLORS[selected.category] || 'bg-gray-100 text-gray-600'}`}>
            {CAT_ICONS[selected.category]} {selected.category}
          </div>
          <div className="text-3xl font-bold text-rose-400 mb-2">#{selected.number}</div>
          <p className="font-playfair text-xl font-semibold text-gray-900 italic leading-snug mb-4">&ldquo;{selected.question}&rdquo;</p>

          {/* Answers */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                {username === 'efo' ? 'Your Answer (Efo)' : "Efo's Answer"}
              </label>
              {username === 'efo' ? (
                <textarea value={myAnswer} onChange={e => setMyAnswer(e.target.value)} rows={3} placeholder="Write your answer..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
              ) : (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-gray-700 min-h-[60px]">
                  {selected.efoAnswer || <span className="text-gray-400 italic">Not answered yet...</span>}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                {username === 'daavi' ? 'Your Answer (Daavi)' : "Daavi's Answer"}
              </label>
              {username === 'daavi' ? (
                <textarea value={myAnswer} onChange={e => setMyAnswer(e.target.value)} rows={3} placeholder="Write your answer..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none" />
              ) : (
                <div className="px-4 py-3 rounded-xl bg-violet-50 border border-violet-100 text-sm text-gray-700 min-h-[60px]">
                  {selected.daaviAnswer || <span className="text-gray-400 italic">Not answered yet...</span>}
                </div>
              )}
            </div>
          </div>

          {(username === 'efo' || username === 'daavi') && (
            <button onClick={saveAnswer} disabled={saving} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Answer 💕'}
            </button>
          )}

          <button onClick={() => setSelected(null)} className="w-full mt-2 py-2.5 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50">
            ← Back to grid
          </button>
        </div>
      )}

      {/* Number grid */}
      <div className="num-grid">
        {questions.map(q => {
          const both = q.efoAnswer && q.daaviAnswer;
          const partial = (q.efoAnswer || q.daaviAnswer) && !both;
          return (
            <button
              key={q.number}
              onClick={() => selectNumber(q)}
              className={`aspect-square rounded-xl font-bold text-sm transition-all active:scale-90 flex items-center justify-center relative
                ${selected?.number === q.number ? 'ring-2 ring-rose-400 ring-offset-1' : ''}
                ${both ? 'bg-gradient-to-br from-rose-400 to-violet-400 text-white shadow-md' :
                  partial ? 'bg-amber-400 text-white shadow-sm' :
                  'bg-white border border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-500'}`}
            >
              {q.number}
              {both && <span className="absolute -top-1 -right-1 text-[8px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gradient-to-br from-rose-400 to-violet-400 inline-block" /> Both answered</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-400 inline-block" /> Partial</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block" /> Open</span>
      </div>
    </div>
  );
}
