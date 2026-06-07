'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { differenceInDays, format } from 'date-fns';

const START_DATE = new Date('2023-01-03');
const ANNIVERSARY = new Date('2026-01-03');

const MOODS: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', grateful: '🙏', romantic: '🥰', tired: '😴', stressed: '😤',
};

const QUICK_ACTIONS = [
  { href: '/games', label: 'Play Game', icon: '🎮', color: 'from-rose-400 to-pink-500' },
  { href: '/reflections', label: 'Reflect', icon: '💌', color: 'from-violet-400 to-purple-500' },
  { href: '/memories', label: 'Memory', icon: '📸', color: 'from-amber-400 to-orange-500' },
  { href: '/notes', label: 'Note', icon: '📝', color: 'from-emerald-400 to-teal-500' },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const daysToAnniv = differenceInDays(ANNIVERSARY, new Date());
  const daysTogether = differenceInDays(new Date(), START_DATE);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setStats);
  }, []);

  const todayMoods = stats?.moodToday || [];
  const myMood = todayMoods.find((m: any) => m.userId === (session?.user as any)?.username);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      {/* Greeting */}
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-violet-600 rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 text-7xl opacity-20 rotate-12">❤️</div>
        <div className="absolute -bottom-4 -left-4 text-5xl opacity-10">💕</div>
        <p className="text-sm font-medium text-white/70 mb-1">Welcome back,</p>
        <h1 className="font-playfair text-3xl font-bold mb-1">{session?.user?.name} 💕</h1>
        <p className="text-white/70 text-sm">Today is {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-3xl font-bold text-gray-900">{daysTogether}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Days Together</div>
          <div className="text-xs text-rose-400 mt-1">Since Jan 3, 2023</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover">
          <div className="text-2xl mb-1">💍</div>
          <div className="text-3xl font-bold text-gray-900">{Math.max(0, daysToAnniv)}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Days to Anniversary</div>
          <div className="text-xs text-violet-400 mt-1">Jan 3, 2026</div>
        </div>
      </div>

      {/* Today's Mood */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">Today&apos;s Mood</h2>
          <Link href="/mood" className="text-xs text-rose-500 font-semibold">Track →</Link>
        </div>
        {todayMoods.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">No moods tracked yet today</p>
        ) : (
          <div className="flex gap-3">
            {todayMoods.map((m: any) => (
              <div key={m._id} className="flex items-center gap-2 bg-rose-50 rounded-xl px-3 py-2">
                <span className="text-xl">{MOODS[m.mood]}</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{m.displayName}</div>
                  <div className="text-xs text-gray-500 capitalize">{m.mood}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!myMood && (
          <Link href="/mood" className="mt-3 block text-center text-xs text-violet-500 font-semibold bg-violet-50 rounded-xl py-2">
            Log your mood today ✨
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3 text-sm">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <div className={`w-14 h-14 bg-gradient-to-br ${a.color} rounded-2xl flex items-center justify-center text-2xl shadow-md`}>
                {a.icon}
              </div>
              <span className="text-[10px] font-semibold text-gray-600 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Memories', value: stats.memoryCount, icon: '📸', color: 'text-amber-500' },
            { label: 'Games', value: stats.answeredGames, icon: '🎮', color: 'text-rose-500' },
            { label: 'Journals', value: stats.reflectionCount, icon: '💌', color: 'text-violet-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center card-hover">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Latest memory */}
      {stats?.recentMemory && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-sm">Latest Memory</h2>
            <Link href="/memories" className="text-xs text-rose-500 font-semibold">See All →</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-violet-100 rounded-xl flex items-center justify-center text-xl">📸</div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{stats.recentMemory.title}</div>
              <div className="text-xs text-gray-500">{format(new Date(stats.recentMemory.date), 'MMM d, yyyy')} · by {stats.recentMemory.uploadedByDisplay}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
