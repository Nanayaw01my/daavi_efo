import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DailyTalk from '@/lib/models/DailyTalk';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export const dynamic = 'force-dynamic';

function getWeekKey(date: Date) {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
}

// GET ?day=0-6&week=optional
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const day = parseInt(searchParams.get('day') ?? String(new Date().getDay()));
  const week = searchParams.get('week') ?? getWeekKey(new Date());
  await connectDB();
  const answers = await DailyTalk.find({ weekKey: week, dayOfWeek: day });
  return NextResponse.json(answers);
}

// PATCH { weekKey, dayOfWeek, questionIndex, answer }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { weekKey, dayOfWeek, questionIndex, answer } = await req.json();
  const username = (session.user as any).username;
  await connectDB();
  const field = username === 'efo' ? 'efoAnswer' : 'daaviAnswer';
  const doc = await DailyTalk.findOneAndUpdate(
    { weekKey, dayOfWeek, questionIndex },
    { $set: { [field]: answer, updatedAt: new Date() } },
    { upsert: true, new: true }
  );
  return NextResponse.json(doc);
}
