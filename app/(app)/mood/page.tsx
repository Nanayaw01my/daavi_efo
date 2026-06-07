'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const MOODS = [
  { key: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-amber-400' },
  { key: 'excited', emoji: '🤩', label: 'Excited', color: 'from-orange-400 to-rose-400' },
  { key: 'calm', emoji: '😌', label: 'Calm', color: 'from-teal-400 to-cyan-400' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful', color: 'from-violet-400 to-purple-400' },
  { key: 'romantic', emoji: '🥰', label: 'Romantic', color: 'from-rose-400 to-pink-400' },
  { key: 'tired', emoji: '😴', label: 'Tired', color: 'from-gray-400 to-slate-400' },
  { key: 'stressed', emoji: '😤', label: 'Stressed', color: 'from-red-400 to-rose-500' },
];

const MOOD_EMOJIS: Record<string, string> = Object.fromEntries(MOODS.map(m => [m.key, m.emoji]));

export default function MoodPage() {
  const { data: session } = useSession();
  const [allMoods, setAllMoods] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const username = (session?.user as any)?.username;

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetch('/api/mood').then(r => r.json()).then(setAllMoods);
  }, []);

  const todayMine = allMoods.find(m => m.userId === username && m.date === today);
  const todayPartner = allMoods.find(m => m.userId !== username && m.userId !== 'admin' && m.date === today);

  async function saveMood() {
    if (!selected) return toast.error('Pick a mood!');
    setSaving(true);
    const res = await fetch('/api/mood', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood: selected, note }) });
    const m = await res.json();
    setAllMoods(prev => {
      const filtered = prev.filter(x => !(x.userId === username && x.date === today));
      return [m, ...filtered];
    });
    setSaving(false);
    toast.success('Mood logged! ✨');
  }

  const last14 = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), 'yyyy-MM-dd'));

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Daily Tracker</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">How are you feeling? 😊</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Today's partner mood */}
      {todayPartner && (
        <div className="bg-gradient-to-r from-violet-50 to-rose-50 border border-violet-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{MOOD_EMOJIS[todayPartner.mood]}</span>
            <div>
              <div className="font-bold text-gray-900">{todayPartner.displayName} is feeling <span className="text-violet-500 capitalize">{todayPartner.mood}</span> today</div>
              {todayPartner.note && <div className="text-sm text-gray-500 mt-0.5">&ldquo;{todayPartner.note}&rdquo;</div>}
            </div>
          </div>
        </div>
      )}

      {/* Mood picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-bold text-gray-800 mb-3 text-sm">{todayMine ? 'Update your mood' : 'How are you feeling?'}</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {MOODS.map(m => (
            <button key={m.key} onClick={() => setSelected(m.key)} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all active:scale-90 ${selected === m.key || todayMine?.mood === m.key ? `border-transparent bg-gradient-to-br ${m.color} text-white shadow-md` : 'border-gray-100 bg-gray-50 text-gray-600'}`}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] font-bold">{m.label}</span>
            </button>
          ))}
          <div />
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note... (optional)" rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none mb-3" />
        <button onClick={saveMood} disabled={saving || !selected} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50">
          {saving ? 'Saving...' : todayMine ? 'Update Mood ✨' : 'Log My Mood ✨'}
        </button>
      </div>

      {/* 14-day chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-gray-800 mb-4 text-sm">Last 14 Days</h2>
        <div className="flex gap-1.5 items-end h-16">
          {last14.map(date => {
            const m = allMoods.find(x => x.userId === username && x.date === date);
            const h = m ? 100 : 0;
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                {m && <span className="text-xs">{MOOD_EMOJIS[m.mood]}</span>}
                <div className={`w-full rounded-t-sm transition-all ${m ? 'bg-gradient-to-t from-rose-400 to-violet-400' : 'bg-gray-100'}`} style={{ height: `${Math.max(h, 10)}%` }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-gray-400">
          <span>{format(subDays(new Date(), 13), 'MMM d')}</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
