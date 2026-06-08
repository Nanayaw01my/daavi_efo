'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, Gamepad2, MessageSquare, Image, Smile, BookOpen, Settings, LogOut, MessageCircleHeart } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { href: '/notes', icon: MessageSquare, label: 'Notes' },
  { href: '/memories', icon: Image, label: 'Memories' },
  { href: '/mood', icon: Smile, label: 'Mood' },
  { href: '/daily-talk', icon: MessageCircleHeart, label: 'Daily' },
  { href: '/reflections', icon: BookOpen, label: 'Journal' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = (session?.user as any)?.role;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-heartbeat inline-block">❤️</span>
          <span className="font-playfair font-bold text-gray-900 text-base">Efo & Daavi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {session?.user?.name || '—'}
          </span>
          {role === 'admin' && (
            <Link href="/admin" className="text-xs font-bold text-white bg-black px-3 py-1 rounded-full">Admin</Link>
          )}
          <button onClick={() => signOut({ callbackUrl: '/' })} className="p-2 rounded-full hover:bg-gray-100 transition-all">
            <LogOut size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-14 pb-nav">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/60 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${active ? 'text-rose-500' : 'text-gray-400'}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={active ? 'text-[10px] font-bold' : 'text-[10px] font-medium'}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
