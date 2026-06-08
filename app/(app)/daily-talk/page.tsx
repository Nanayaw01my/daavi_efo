'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { DAILY_TOPICS } from '@/lib/dailyTalkTopics';
import toast from 'react-hot-toast';
import { getISOWeek, getISOWeekYear, format } from 'date-fns';
import Link from 'next/link';
import { Crown } from 'lucide-react';

function getWeekKey(date: Date) {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
}

interface AnswerDoc {
  questionIndex: number;
  efoAnswer: string;
  daaviAnswer: string;
}

export default function DailyTalkPage() {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username as 'efo' | 'daavi' | undefined;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekKey = getWeekKey(today);
  const topic = DAILY_TOPICS[dayOfWeek];

  const [answers, setAnswers] = useState<Record<number, AnswerDoc>>({});
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});
  const [savedFlags, setSavedFlags] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  // The partner's username
  const partnerUsername = username === 'efo' ? 'daavi' : 'efo';
  const partnerDisplayName = username === 'efo' ? 'Daavi' : 'Efo';
  const myDisplayName = username === 'efo' ? 'Efo' : 'Daavi';
  const leaderDisplayName = topic.leader === 'efo' ? 'Efo' : 'Daavi';

  // Fetch answers
  useEffect(() => {
    setLoading(true);
    fetch(`/api/daily-talk?day=${dayOfWeek}&week=${weekKey}`)
      .then(r => r.json())
      .then((docs: AnswerDoc[]) => {
        const map: Record<number, AnswerDoc> = {};
        const localMap: Record<number, string> = {};
        docs.forEach(doc => {
          map[doc.questionIndex] = doc;
          // Pre-fill textarea with my own answer
          if (username === 'efo') {
            localMap[doc.questionIndex] = doc.efoAnswer || '';
          } else if (username === 'daavi') {
            localMap[doc.questionIndex] = doc.daaviAnswer || '';
          }
        });
        setAnswers(map);
        setLocalAnswers(localMap);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load answers');
        setLoading(false);
      });
  }, [dayOfWeek, weekKey, username]);

  const saveAnswer = useCallback(async (questionIndex: number) => {
    const answer = localAnswers[questionIndex] ?? '';
    try {
      const res = await fetch('/api/daily-talk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekKey, dayOfWeek, questionIndex, answer }),
      });
      if (!res.ok) throw new Error('Save failed');
      const doc: AnswerDoc = await res.json();
      setAnswers(prev => ({ ...prev, [questionIndex]: doc }));
      setSavedFlags(prev => ({ ...prev, [questionIndex]: true }));
      // Clear saved indicator after 2s
      setTimeout(() => {
        setSavedFlags(prev => ({ ...prev, [questionIndex]: false }));
      }, 2000);
    } catch {
      toast.error('Could not save answer');
    }
  }, [localAnswers, weekKey, dayOfWeek]);

  const handleBlur = (questionIndex: number) => {
    saveAnswer(questionIndex);
  };

  const handleChange = (questionIndex: number, value: string) => {
    setLocalAnswers(prev => ({ ...prev, [questionIndex]: value }));
    // Clear saved indicator when editing
    setSavedFlags(prev => ({ ...prev, [questionIndex]: false }));
  };

  // Calculate progress: how many questions I've answered
  const myAnsweredCount = topic.questions.reduce((count, _, idx) => {
    const doc = answers[idx];
    if (!doc) return count;
    const myAnswer = username === 'efo' ? doc.efoAnswer : doc.daaviAnswer;
    return myAnswer && myAnswer.trim().length > 0 ? count + 1 : count;
  }, 0);

  const getPartnerAnswer = (questionIndex: number) => {
    const doc = answers[questionIndex];
    if (!doc) return null;
    return username === 'efo' ? doc.daaviAnswer : doc.efoAnswer;
  };

  // Past days (other days of the week)
  const pastDays = DAILY_TOPICS.filter(t => t.dayOfWeek !== dayOfWeek);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      {/* Header Card */}
      <div className={`bg-gradient-to-br ${topic.color} rounded-3xl p-6 text-white relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 text-8xl opacity-10 rotate-12 select-none">
          {topic.emoji}
        </div>
        <div className="absolute -bottom-4 -left-4 text-4xl opacity-10 select-none">💬</div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
          <Crown size={12} className="text-yellow-300" />
          <span className="text-xs font-bold text-white">
            {topic.leader === 'efo' ? "Efo's Day" : "Daavi's Day"}
          </span>
        </div>

        {/* Emoji + Title */}
        <div className="flex items-start gap-3 mb-2">
          <span className="text-4xl">{topic.emoji}</span>
          <div>
            <h1 className="font-playfair text-2xl font-bold leading-tight">{topic.title}</h1>
            <p className="text-white/75 text-sm mt-0.5">{topic.subtitle}</p>
          </div>
        </div>

        {/* Leader line */}
        <div className="flex items-center gap-1.5 mt-3 mb-1">
          <Crown size={14} className="text-yellow-300" />
          <span className="text-sm font-medium text-white/90">
            {leaderDisplayName} is leading today&apos;s conversation
          </span>
        </div>

        {/* Day + date */}
        <p className="text-white/60 text-xs mt-1">
          {topic.dayName} · {format(today, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-rose-50 border border-rose-200 rounded-full px-4 py-1.5 flex items-center gap-2">
            <span className="text-rose-500 font-bold text-sm">{myAnsweredCount}</span>
            <span className="text-gray-400 text-sm">/</span>
            <span className="text-gray-600 font-medium text-sm">22 answered by you</span>
          </div>
        </div>
        {loading && (
          <span className="text-xs text-gray-400 italic">Loading...</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden -mt-2">
        <div
          className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${(myAnsweredCount / 22) * 100}%` }}
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {topic.questions.map((question, idx) => {
          const partnerAnswer = getPartnerAnswer(idx);
          const isSaved = savedFlags[idx];
          const myCurrentAnswer = localAnswers[idx] ?? '';

          return (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Question Header */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-7 h-7 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-gray-900 font-semibold text-sm leading-relaxed">{question}</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* My Answer Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Your Answer
                    </label>
                    {isSaved && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Saved
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={myCurrentAnswer}
                    onChange={e => handleChange(idx, e.target.value)}
                    onBlur={() => handleBlur(idx)}
                    placeholder="Write your answer here..."
                    className="w-full text-sm text-gray-800 placeholder-gray-300 bg-rose-50/50 border border-rose-100 rounded-xl px-3 py-2.5 resize-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                {/* Partner's Answer Section */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    {partnerDisplayName}&apos;s Answer
                  </label>
                  {partnerAnswer && partnerAnswer.trim().length > 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{partnerAnswer}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 italic px-1">Not yet answered...</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past Sessions */}
      <div className="pb-4">
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors">
              <span>Past sessions</span>
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pastDays.map(t => (
              <Link
                key={t.dayOfWeek}
                href={`/daily-talk?day=${t.dayOfWeek}`}
                className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-rose-200 hover:bg-rose-50/30 transition-all"
              >
                <span className="text-lg">{t.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">{t.dayName}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{t.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
