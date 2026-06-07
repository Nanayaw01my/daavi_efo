'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'wentWell', label: '✅ What went well this week?', placeholder: 'Share what made this week special...' },
  { key: 'madeHappy', label: '😊 What made me happy?', placeholder: 'Moments of joy this week...' },
  { key: 'appreciation', label: '🙏 I appreciate my partner for...', placeholder: 'What did they do that touched you?' },
  { key: 'improvements', label: '📈 Areas we can improve', placeholder: 'Honest, kind growth notes...' },
  { key: 'concerns', label: '💭 Concerns or frustrations', placeholder: 'Things on your mind...' },
  { key: 'nextWeekGoals', label: '🎯 Goals for next week', placeholder: 'What do you want to achieve together?' },
  { key: 'futurePlans', label: '🌍 Future plans', placeholder: 'Dreams and plans for the future...' },
];

export default function ReflectionsPage() {
  const { data: session } = useSession();
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [reflections, setReflections] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'read'>('write');
  const username = (session?.user as any)?.username;

  const thisWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-WW');

  useEffect(() => {
    fetch('/api/reflections/weeks').then(r => r.json()).then(data => {
      setWeeks(data);
      const hasThisWeek = data.find((w: any) => w._id === thisWeek);
      if (!hasThisWeek) setWeeks(prev => [{ _id: thisWeek, weekLabel: getCurrentWeekLabel(), count: 0 }, ...prev]);
    });
    setSelectedWeek(thisWeek);
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      fetch(`/api/reflections?week=${selectedWeek}`).then(r => r.json()).then(data => {
        setReflections(data);
        const mine = data.find((r: any) => r.userId === username);
        setForm(mine ? { wentWell: mine.wentWell, madeHappy: mine.madeHappy, appreciation: mine.appreciation, improvements: mine.improvements, concerns: mine.concerns, nextWeekGoals: mine.nextWeekGoals, futurePlans: mine.futurePlans } : {});
      });
    }
  }, [selectedWeek, username]);

  function getCurrentWeekLabel() {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }

  async function save() {
    if (!Object.values(form).some(v => v.trim())) return toast.error('Fill in at least one field.');
    setSaving(true);
    await fetch('/api/reflections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    toast.success('Reflection saved! 💌');
    fetch(`/api/reflections?week=${selectedWeek}`).then(r => r.json()).then(setReflections);
  }

  const partnerName = username === 'efo' ? 'Daavi' : 'Efo';
  const partnerReflection = reflections.find(r => r.userId !== username);
  const isCurrentWeek = selectedWeek === thisWeek;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-violet-100 text-violet-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Weekly Journal</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Reflections 💌</h1>
        <p className="text-gray-500 text-sm mt-1">Write weekly, grow together.</p>
      </div>

      {/* Week selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {weeks.map(w => (
          <button key={w._id} onClick={() => setSelectedWeek(w._id)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedWeek === w._id ? 'bg-violet-500 text-white border-violet-500 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
            {w._id === thisWeek ? 'This Week' : w.weekLabel || w._id}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        <button onClick={() => setActiveTab('write')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'write' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}>
          Write Mine
        </button>
        <button onClick={() => setActiveTab('read')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'read' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}>
          {partnerName}&apos;s {partnerReflection ? '✓' : '...'}
        </button>
      </div>

      {activeTab === 'write' ? (
        <div className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs font-bold text-gray-700 mb-2">{f.label}</label>
              <textarea
                value={form[f.key] || ''}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                rows={2}
                placeholder={f.placeholder}
                disabled={!isCurrentWeek}
                className="w-full text-sm text-gray-800 resize-none border-0 outline-none placeholder:text-gray-400 disabled:opacity-50"
              />
            </div>
          ))}
          {isCurrentWeek && (
            <button onClick={save} disabled={saving} className="w-full py-4 bg-gradient-to-r from-violet-500 to-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-violet-200 active:scale-95 transition-all disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Reflection 💌'}
            </button>
          )}
        </div>
      ) : (
        <div>
          {!partnerReflection ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">⏳</div>
              <p className="font-medium">{partnerName} hasn&apos;t written yet this week.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-violet-50 to-rose-50 rounded-2xl border border-violet-100 p-4">
                <div className="font-bold text-violet-700 mb-1">{partnerName}&apos;s Reflection</div>
                <div className="text-xs text-gray-500">{partnerReflection.weekLabel}</div>
              </div>
              {FIELDS.map(f => partnerReflection[f.key] && (
                <div key={f.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="text-xs font-bold text-gray-500 mb-2">{f.label}</div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{partnerReflection[f.key]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
