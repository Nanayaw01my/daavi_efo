'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [who, setWho] = useState<'efo' | 'daavi' | ''>('');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!who) return toast.error('Please select who you are.');
    if (form.password !== form.confirm) return toast.error('Passwords do not match.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');

    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: who, displayName: who.charAt(0).toUpperCase() + who.slice(1), password: form.password }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success(`Account created! Welcome, ${who.charAt(0).toUpperCase() + who.slice(1)}! 💕`);
      router.push('/login');
    } else {
      toast.error(data.error || 'Something went wrong.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-violet-50 via-white to-rose-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-heartbeat inline-block">🌸</div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1 text-sm">Only Efo and Daavi can join</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Who are you?</label>
              <div className="grid grid-cols-2 gap-3">
                {(['efo', 'daavi'] as const).map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setWho(name)}
                    className={`py-4 rounded-xl border-2 font-bold text-sm capitalize transition-all ${
                      who === name
                        ? 'border-rose-400 bg-rose-50 text-rose-600 shadow-md shadow-rose-100'
                        : 'border-gray-200 text-gray-500 hover:border-rose-200'
                    }`}
                  >
                    {name === 'efo' ? '🌸' : '⭐'} {name.charAt(0).toUpperCase() + name.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-200 hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create My Account 💕'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-500 font-semibold hover:underline">Login</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            <Link href="/" className="hover:text-gray-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
