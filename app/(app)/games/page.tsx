'use client';
import Link from 'next/link';

const GAMES = [
  {
    href: '/games/pick-a-number',
    icon: '🔢',
    title: 'Pick A Number',
    desc: 'Choose 1–50. Each number hides a question. Answer honestly, answer together.',
    badge: '50 Questions',
    color: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-200',
  },
  {
    href: '/games/truth-or-dare',
    icon: '🎭',
    title: 'Truth or Dare',
    desc: 'Draw a card and go — deep truths or daring challenges. Couples edition.',
    badge: 'Couples Edition',
    color: 'from-violet-400 to-purple-500',
    shadow: 'shadow-violet-200',
  },
  {
    href: '/games/would-you-rather',
    icon: '🤔',
    title: 'Would You Rather',
    desc: 'Tough dilemmas, real answers. See where you agree and where you differ.',
    badge: '20 Scenarios',
    color: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-200',
  },
  {
    href: '/games/this-or-that',
    icon: '⚡',
    title: 'This or That',
    desc: 'Lightning-fast choices. Coffee or tea? Beach or mountains? Find out!',
    badge: '20 Rounds',
    color: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-emerald-200',
  },
  {
    href: '/games/guess-partner',
    icon: '🧠',
    title: 'Guess Your Partner',
    desc: 'Both answer 20 questions about yourselves. Then see how well you match!',
    badge: '20 Questions',
    color: 'from-blue-400 to-indigo-500',
    shadow: 'shadow-blue-200',
  },
  {
    href: '/games/love-quiz',
    icon: '💝',
    title: 'Love Compatibility',
    desc: 'A 10-question compatibility quiz. Answer independently, then compare results.',
    badge: '10 Questions',
    color: 'from-pink-400 to-rose-500',
    shadow: 'shadow-pink-200',
  },
  {
    href: '/games/date-night',
    icon: '🌙',
    title: 'Date Night Generator',
    desc: '55 date ideas across 5 categories. Spin, save your favorites, mark as done.',
    badge: '55 Ideas',
    color: 'from-slate-600 to-gray-800',
    shadow: 'shadow-gray-300',
  },
  {
    href: '/games/memory-challenge',
    icon: '🏆',
    title: 'Memory Challenge',
    desc: 'How well do you know each other? Answer 15 questions and find out.',
    badge: '15 Questions',
    color: 'from-purple-400 to-violet-600',
    shadow: 'shadow-purple-200',
  },
];

export default function GamesPage() {
  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Play Together</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Couple Games 🎮</h1>
        <p className="text-gray-500 text-sm mt-1">8 real games designed to bring you closer every time you play.</p>
      </div>

      <div className="space-y-3">
        {GAMES.map((g, i) => (
          <Link
            key={g.href}
            href={g.href}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 card-hover active:scale-[0.98] transition-all animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${g.color} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg ${g.shadow}`}>
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="font-bold text-gray-900">{g.title}</h3>
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{g.badge}</span>
                </div>
                <p className="text-xs text-gray-500 leading-snug">{g.desc}</p>
              </div>
              <span className="text-gray-300 text-lg flex-shrink-0">›</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-br from-rose-50 to-violet-50 border border-rose-100 rounded-2xl p-4 text-center">
        <div className="text-2xl mb-1">💕</div>
        <p className="text-sm font-semibold text-gray-700">More games coming soon</p>
        <p className="text-xs text-gray-500 mt-0.5">We&apos;ll keep adding more ways to connect</p>
      </div>
    </div>
  );
}
