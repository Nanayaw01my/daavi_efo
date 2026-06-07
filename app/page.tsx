'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STATS = [
  { label: 'Days Together', value: '847', icon: '📅' },
  { label: 'Memories', value: '42', icon: '📸' },
  { label: 'Games', value: '50', icon: '🎮' },
  { label: 'Reflections', value: '∞', icon: '💌' },
];

const FEATURES = [
  { icon: '🎮', title: 'Couple Games', desc: '8 intimate games designed to bring you closer — Pick A Number, Truth or Dare, Would You Rather and more.' },
  { icon: '💌', title: 'Weekly Reflections', desc: 'A private journal where both of you write weekly — what went well, appreciation notes, and future goals.' },
  { icon: '📸', title: 'Memory Gallery', desc: 'Upload and organize your most beautiful moments into a shared timeline that lives forever.' },
  { icon: '😊', title: 'Mood Tracker', desc: 'Know how each other feels every day. See mood trends and be a better partner.' },
  { icon: '📝', title: 'Shared Notes', desc: 'Leave messages, reminders, goals, and bucket list items for each other in real time.' },
  { icon: '🔒', title: 'Private & Secure', desc: 'Only Efo and Daavi can access this space. Yours exclusively, always.' },
];

export default function LandingPage() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = 847;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      setCount(c => {
        if (c + step >= target) { clearInterval(timer); return target; }
        return c + step;
      });
    }, 20);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 glass border-b border-white/40">
        <span className="font-playfair text-lg font-bold text-gray-900">Efo ❤️ Daavi</span>
        <div className="flex gap-2">
          <Link href="/login" className="text-sm font-semibold text-gray-700 px-4 py-2 rounded-full border border-gray-200 hover:border-rose-300 transition-all">Login</Link>
          <Link href="/register" className="text-sm font-semibold text-white px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-violet-500 hover:opacity-90 transition-all shadow-md">Join</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 overflow-hidden">
        {/* BG blobs */}
        <div className="absolute top-1/4 -left-32 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-200 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-60" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-full px-4 py-2 text-xs font-semibold text-rose-600 tracking-widest uppercase mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            Private · Intimate · Exclusively Ours
          </div>

          <h1 className="font-playfair text-5xl sm:text-7xl font-bold leading-none mb-4 animate-fade-in delay-100">
            Efo{' '}
            <span className="inline-block animate-heartbeat text-rose-500">❤️</span>
            {' '}Daavi
          </h1>

          <p className="text-gray-500 text-lg sm:text-xl leading-relaxed mb-10 animate-fade-in delay-200 max-w-lg mx-auto">
            Built for us. Our memories, our games, our growth.<br />
            <span className="gradient-text font-semibold">A private relationship operating system.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in delay-300">
            <Link href="/login" className="px-8 py-4 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all active:scale-95 flex items-center justify-center gap-2">
              Enter Our Space <span>→</span>
            </Link>
            <Link href="/register" className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-base hover:border-rose-300 hover:text-rose-500 transition-all active:scale-95">
              Create Account
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex flex-wrap justify-center gap-3 mt-14 animate-fade-in delay-400">
          {STATS.map((s, i) => (
            <div key={i} className="glass border border-white/60 rounded-2xl px-5 py-4 text-center min-w-[110px] shadow-sm hover:shadow-md transition-all card-hover">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-2xl text-gray-900">{s.label === 'Days Together' ? count : s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 bg-gradient-to-b from-white to-rose-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block bg-violet-100 text-violet-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase">Everything We Need</div>
            <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Built Just for Us</h2>
            <p className="text-gray-500 text-lg">Every feature designed with love and intention.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 card-hover shadow-sm animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-12 h-12 bg-gradient-to-br from-rose-50 to-violet-50 border border-rose-100 rounded-xl flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-20 px-5 text-center text-white">
        <div className="max-w-lg mx-auto">
          <div className="text-5xl mb-6 animate-heartbeat">❤️</div>
          <h2 className="font-playfair text-4xl font-bold mb-4">This is Our Space</h2>
          <p className="text-white/80 text-lg mb-8">Only Efo and Daavi can enter. Built with love, forever ours.</p>
          <Link href="/register" className="inline-block bg-white text-rose-500 font-bold px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 text-lg">
            Create Your Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm bg-gray-950">
        <span className="font-playfair text-white/60">Efo ❤️ Daavi</span>
        <span className="mx-2 text-gray-700">·</span>
        Private & Intimate
        <span className="mx-2 text-gray-700">·</span>
        Always Ours
      </footer>
    </div>
  );
}
