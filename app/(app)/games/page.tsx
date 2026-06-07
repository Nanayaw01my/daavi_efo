'use client';
import Link from 'next/link';

const GAMES = [
  { href: '/games/pick-a-number', icon: '🔢', title: 'Pick A Number', desc: 'Choose 1–50. Reveal a question. Share your heart.', badge: '50 Questions', color: 'from-rose-400 to-pink-500' },
  { href: '/games/truth-or-dare', icon: '🎭', title: 'Truth or Dare', desc: 'Couples edition with deep and romantic prompts.', badge: 'Couples Edition', color: 'from-violet-400 to-purple-500' },
  { href: '/games/would-you-rather', icon: '🤔', title: 'Would You Rather', desc: 'Fun dilemmas that reveal who you really are.', badge: '15 Scenarios', color: 'from-amber-400 to-orange-500' },
  { href: '/games/this-or-that', icon: '⚡', title: 'This or That', desc: 'Quick fire choices — how well do you match?', badge: '15 Rounds', color: 'from-emerald-400 to-teal-500' },
];

const COMING = [
  { icon: '🧠', title: 'Guess Your Partner', desc: 'Predict what your partner will choose.' },
  { icon: '💝', title: 'Love Quiz', desc: 'Test how deeply you know each other.' },
  { icon: '🌙', title: 'Date Night Generator', desc: 'Spin for a perfect date idea.' },
  { icon: '🏆', title: 'Memory Challenge', desc: 'Quiz on your shared memories.' },
];

export default function GamesPage() {
  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Play Together</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Couple Games 🎮</h1>
        <p className="text-gray-500 text-sm mt-1">Fun and intimate games designed to bring you closer.</p>
      </div>

      {/* Active games */}
      <div className="space-y-3 mb-8">
        {GAMES.map(g => (
          <Link key={g.href} href={g.href} className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 card-hover active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${g.color} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-md`}>
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-gray-900">{g.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{g.badge}</span>
                </div>
                <p className="text-sm text-gray-500 leading-snug">{g.desc}</p>
              </div>
              <span className="text-gray-300 text-lg flex-shrink-0">›</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Coming soon */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Coming Soon</h2>
        <div className="grid grid-cols-2 gap-3">
          {COMING.map(g => (
            <div key={g.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 opacity-60">
              <div className="text-2xl mb-2">{g.icon}</div>
              <div className="font-bold text-gray-700 text-sm">{g.title}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-snug">{g.desc}</div>
              <div className="text-xs text-gray-400 mt-2 font-medium">Coming soon...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
