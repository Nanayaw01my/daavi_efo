'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Statement {
  _id: string;
  statementId: number;
  statement: string;
  efoHave: boolean | null;
  daaviHave: boolean | null;
}

export default function NeverHaveIEverPage() {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username as string | undefined;

  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');

  const fetchStatements = useCallback(async () => {
    const res = await fetch('/api/games/never-have-i-ever').catch(() => null);
    if (res?.ok) {
      const data: Statement[] = await res.json();
      setStatements(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatements();
    const t = setInterval(fetchStatements, 5000);
    return () => clearInterval(t);
  }, [fetchStatements]);

  async function answer(statementId: number, have: boolean) {
    setSubmitting(statementId);
    try {
      const res = await fetch('/api/games/never-have-i-ever', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId, have }),
      });
      if (res.ok) {
        const updated: Statement = await res.json();
        setStatements(prev => prev.map(s => s.statementId === statementId ? updated : s));
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading || !username) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-4xl animate-pulse">🙈</div>
    </div>
  );

  const myField = username === 'efo' ? 'efoHave' : 'daaviHave';
  const partnerField = username === 'efo' ? 'daaviHave' : 'efoHave';
  const partnerName = username === 'efo' ? 'Daavi' : 'Efo';

  const answered = statements.filter(s => s[myField as keyof Statement] !== null);
  const filtered = filter === 'answered' ? answered
    : filter === 'unanswered' ? statements.filter(s => s[myField as keyof Statement] === null)
    : statements;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-5">
        <div className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Game</div>
        <h1 className="font-bold text-2xl text-gray-900">Never Have I Ever 🙈</h1>
        <p className="text-gray-500 text-sm mt-1">Tap to reveal — see what you and {partnerName} admit to!</p>
        <p className="text-xs text-purple-600 font-medium mt-1">{answered.length}/{statements.length} answered</p>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'unanswered', 'answered'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(s => {
          const myHave = s[myField as keyof Statement] as boolean | null;
          const partnerHave = s[partnerField as keyof Statement] as boolean | null;
          const isSubmitting = submitting === s.statementId;

          return (
            <div key={s._id} className={`rounded-2xl border p-4 transition-all ${myHave !== null ? 'bg-white border-purple-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-gray-800 font-medium text-sm italic mb-3">&ldquo;{s.statement}&rdquo;</p>
              <div className="flex items-center gap-3">
                {myHave === null ? (
                  <>
                    <button onClick={() => answer(s.statementId, true)} disabled={isSubmitting}
                      className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all">
                      😅 I Have!
                    </button>
                    <button onClick={() => answer(s.statementId, false)} disabled={isSubmitting}
                      className="flex-1 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all">
                      😇 Never
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex items-center gap-3">
                    <div className={`flex-1 text-center py-1.5 rounded-xl text-sm font-bold ${myHave ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                      You: {myHave ? '😅 Have' : '😇 Never'}
                    </div>
                    {partnerHave !== null ? (
                      <div className={`flex-1 text-center py-1.5 rounded-xl text-sm font-bold ${partnerHave ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {partnerName}: {partnerHave ? '😅 Have' : '😇 Never'}
                      </div>
                    ) : (
                      <div className="flex-1 text-center py-1.5 text-xs text-gray-400">
                        {partnerName} hasn&apos;t answered yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <button onClick={async () => {
          if (!confirm('Reset all answers?')) return;
          await fetch('/api/games/never-have-i-ever', { method: 'DELETE' });
          await fetchStatements();
          toast.success('Answers reset!');
        }} className="text-xs text-gray-400 hover:text-red-400 transition-colors underline">
          Reset All Answers
        </button>
      </div>
    </div>
  );
}
