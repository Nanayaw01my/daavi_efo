'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CoupleGoal {
  _id: string;
  text: string;
  completed: boolean;
  completedBy: string | null;
  addedBy: string;
  addedByDisplay: string;
  createdAt: string;
}

export default function GoalsPage() {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username;
  const displayName = username === 'efo' ? 'Efo' : 'Daavi';

  const [goals, setGoals] = useState<CoupleGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState('');
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      const r = await fetch('/api/goals');
      if (!r.ok) return;
      const data = await r.json();
      setGoals(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
    const t = setInterval(loadGoals, 5000);
    return () => clearInterval(t);
  }, [loadGoals]);

  async function addGoal() {
    if (!newGoal.trim()) return toast.error('Write a goal first! 💫');
    setAdding(true);
    try {
      const r = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newGoal }),
      });
      if (!r.ok) {
        toast.error('Could not add goal');
        return;
      }
      setNewGoal('');
      await loadGoals();
      toast.success('Goal added! 💫');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setAdding(false);
    }
  }

  async function toggleGoal(goalId: string) {
    setTogglingId(goalId);
    try {
      const r = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      if (!r.ok) {
        toast.error('Could not update goal');
        return;
      }
      await loadGoals();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteGoal(goalId: string) {
    setDeletingId(goalId);
    try {
      const r = await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      if (!r.ok) {
        const data = await r.json();
        toast.error(data.error || 'Could not delete goal');
        return;
      }
      setGoals(g => g.filter(x => x._id !== goalId));
      toast.success('Goal removed');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setDeletingId(null);
    }
  }

  const todo = goals.filter(g => !g.completed);
  const done = goals.filter(g => g.completed);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">💫</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Bucket List</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Couple Goals 💫</h1>
        <p className="text-gray-500 text-sm mt-1">Things we want to do together</p>
      </div>

      {/* Add goal input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !adding && addGoal()}
          placeholder="Add a new goal..."
          maxLength={120}
          className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-gray-900 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white shadow-sm"
        />
        <button
          onClick={addGoal}
          disabled={adding || !newGoal.trim()}
          className="px-5 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-pink-200 active:scale-95 transition-all disabled:opacity-60"
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>

      {/* To Do section */}
      {todo.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>To Do</span>
            <span className="text-base">✨</span>
            <span className="ml-auto bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">{todo.length}</span>
          </h2>
          <div className="space-y-2">
            {todo.map((goal, i) => (
              <GoalItem
                key={goal._id}
                goal={goal}
                username={username}
                displayName={displayName}
                toggling={togglingId === goal._id}
                deleting={deletingId === goal._id}
                onToggle={() => toggleGoal(goal._id)}
                onDelete={() => deleteGoal(goal._id)}
                delay={i * 40}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {todo.length === 0 && done.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💫</div>
          <p className="font-medium text-gray-500">No goals yet!</p>
          <p className="text-sm mt-1">Add your first couple goal above</p>
        </div>
      )}

      {todo.length === 0 && done.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 text-center mb-6">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm font-semibold text-emerald-700">All goals completed!</p>
          <p className="text-xs text-emerald-500 mt-1">You two are crushing it 💪</p>
        </div>
      )}

      {/* Done section */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>Done</span>
            <span className="text-base">✅</span>
            <span className="ml-auto bg-emerald-100 text-emerald-600 text-xs px-2 py-0.5 rounded-full font-medium">{done.length}</span>
          </h2>
          <div className="space-y-2">
            {done.map((goal, i) => (
              <GoalItem
                key={goal._id}
                goal={goal}
                username={username}
                displayName={displayName}
                toggling={togglingId === goal._id}
                deleting={deletingId === goal._id}
                onToggle={() => toggleGoal(goal._id)}
                onDelete={() => deleteGoal(goal._id)}
                delay={i * 40}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 bg-gradient-to-br from-rose-50 to-fuchsia-50 border border-rose-100 rounded-2xl p-4 text-center">
        <div className="text-2xl mb-1">💕</div>
        <p className="text-sm font-semibold text-gray-700">{goals.length} {goals.length === 1 ? 'dream' : 'dreams'} together</p>
        <p className="text-xs text-gray-400 mt-0.5">{done.length} completed · {todo.length} to go</p>
      </div>
    </div>
  );
}

interface GoalItemProps {
  goal: CoupleGoal;
  username: string;
  displayName: string;
  toggling: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
  delay: number;
}

function GoalItem({ goal, username, toggling, deleting, onToggle, onDelete, delay }: GoalItemProps) {
  const completedByDisplay = goal.completedBy === 'efo' ? 'Efo' : goal.completedBy === 'daavi' ? 'Daavi' : goal.completedBy;

  return (
    <div
      className={`bg-white rounded-2xl border p-4 shadow-sm animate-fade-in transition-all ${goal.completed ? 'border-emerald-100 opacity-75' : 'border-gray-100'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all active:scale-90 ${
            goal.completed
              ? 'bg-rose-500 border-rose-500 text-white'
              : 'border-gray-300 hover:border-rose-400'
          } ${toggling ? 'opacity-50' : ''}`}
        >
          {goal.completed && (
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 10" fill="none">
              <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Text & meta */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${goal.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {goal.text}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400">
              Added by {goal.addedByDisplay} · {formatDistanceToNow(new Date(goal.createdAt), { addSuffix: true })}
            </span>
            {goal.completed && goal.completedBy && (
              <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                ✓ {completedByDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Delete (own goals only) */}
        {goal.addedBy === username && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className={`p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0 ${deleting ? 'opacity-50' : ''}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
