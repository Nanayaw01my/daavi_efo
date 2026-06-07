'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { ...form, redirect: false });
    setLoading(false);
    if (res?.ok) {
      toast.success('Welcome back! 💕');
      router.push('/dashboard');
    } else {
      toast.error('Wrong username or password.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-rose-50 via-white to-violet-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-heartbeat inline-block">❤️</div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter your private space</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-rose-100 border border-rose-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="efo, daavi, or admin"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 mt-2"
            >
              {loading ? 'Entering...' : 'Enter Our Space →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            New here?{' '}
            <Link href="/register" className="text-rose-500 font-semibold hover:underline">Create Account</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            <Link href="/" className="hover:text-gray-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
