'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shield, Users, Trash2, RefreshCw, RotateCcw } from 'lucide-react';

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [resetPwd, setResetPwd] = useState<{ userId: string; name: string } | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (role && role !== 'admin') router.push('/dashboard');
    fetch('/api/admin').then(r => r.json()).then(setData);
  }, [role]);

  async function action(body: object) {
    setLoading(true);
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    setLoading(false);
    if (d.ok) { toast.success('Done!'); fetch('/api/admin').then(r => r.json()).then(setData); }
    else toast.error(d.error || 'Error');
  }

  if (!data) return (
    <div className="p-8 text-center">
      <div className="animate-spin text-3xl">⚙️</div>
      <p className="text-gray-500 mt-2">Loading admin panel...</p>
    </div>
  );

  const stats = data.stats;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg">Admin Panel</div>
            <div className="text-slate-400 text-xs">Full system access</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Notes', value: stats.noteCount },
            { label: 'Memories', value: stats.memoryCount },
            { label: 'Journals', value: stats.reflectionCount },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Users */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-gray-500" />
          <h2 className="font-bold text-gray-900">Users ({data.users.length})</h2>
        </div>
        <div className="space-y-3">
          {data.users.map((u: any) => (
            <div key={u._id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-violet-100 rounded-xl flex items-center justify-center font-bold text-gray-700 text-sm">
                  {u.displayName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{u.displayName}</div>
                  <div className="text-xs text-gray-400">@{u.username} · {u.role}</div>
                </div>
              </div>
              {u.role !== 'admin' && (
                <button onClick={() => { setResetPwd({ userId: u._id, name: u.displayName }); setNewPwd(''); }} className="text-xs bg-amber-100 text-amber-600 px-3 py-1.5 rounded-xl font-semibold hover:bg-amber-200 transition-all">
                  Reset PWD
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reset password modal */}
      {resetPwd && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 animate-scale-in">
          <div className="font-bold text-amber-700 mb-3">Reset {resetPwd.name}&apos;s Password</div>
          <input value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password (min 6 chars)" type="password" className="w-full px-4 py-3 rounded-xl border border-amber-200 text-gray-900 text-sm mb-3 focus:border-amber-400 outline-none" />
          <div className="flex gap-2">
            <button onClick={() => setResetPwd(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm">Cancel</button>
            <button onClick={async () => { if (newPwd.length < 6) return toast.error('Min 6 chars'); await action({ action: 'resetPassword', userId: resetPwd.userId, newPassword: newPwd }); setResetPwd(null); }} disabled={loading} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm active:scale-95">
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Maintenance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-bold text-gray-900 mb-3">Maintenance</h2>
        <div className="space-y-2">
          <button onClick={() => action({ action: 'resetPickNumber' })} disabled={loading} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-left">
            <RotateCcw size={18} className="text-violet-500" />
            <div>
              <div className="font-semibold text-gray-800 text-sm">Reset Pick-A-Number</div>
              <div className="text-xs text-gray-500">Clear all game answers</div>
            </div>
          </button>
          {['notes', 'memories', 'moods', 'reflections'].map(col => (
            <button key={col} onClick={() => { if (confirm(`Delete ALL ${col}? This cannot be undone.`)) action({ action: 'clearCollection', collection: col }); }} disabled={loading} className="w-full flex items-center gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-all text-left">
              <Trash2 size={18} className="text-red-400" />
              <div>
                <div className="font-semibold text-red-700 text-sm capitalize">Delete all {col}</div>
                <div className="text-xs text-red-400">Permanent — cannot be undone</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Seed */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-gray-900 mb-3">Database</h2>
        <button onClick={() => action({ action: 'seed' })} disabled={loading} className="w-full flex items-center gap-3 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all text-left">
          <RefreshCw size={18} className="text-emerald-500" />
          <div>
            <div className="font-semibold text-emerald-700 text-sm">Re-seed questions</div>
            <div className="text-xs text-emerald-500">Re-add Pick-A-Number questions</div>
          </div>
        </button>
      </div>
    </div>
  );
}
