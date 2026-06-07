import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import connectDB from '@/lib/mongodb';
import Reflection from '@/lib/models/Reflection';

function getWeekKey(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return format(start, 'yyyy-WW');
}

function getWeekLabel(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const week = searchParams.get('week') || getWeekKey(new Date());
  const reflections = await Reflection.find({ week }).sort({ createdAt: -1 });
  return NextResponse.json(reflections);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const week = getWeekKey(new Date());
  const weekLabel = getWeekLabel(new Date());

  await connectDB();
  const reflection = await Reflection.findOneAndUpdate(
    { userId: (session.user as any).username, week },
    { ...body, userId: (session.user as any).username, displayName: session.user.name, week, weekLabel, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return NextResponse.json(reflection);
}

