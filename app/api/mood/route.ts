import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { format } from 'date-fns';
import connectDB from '@/lib/mongodb';
import Mood from '@/lib/models/Mood';

export async function GET() {
  await connectDB();
  const moods = await Mood.find().sort({ date: -1 }).limit(60);
  return NextResponse.json(moods);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mood, note } = await req.json();
  const date = format(new Date(), 'yyyy-MM-dd');

  await connectDB();
  const entry = await Mood.findOneAndUpdate(
    { userId: (session.user as any).username, date },
    { userId: (session.user as any).username, displayName: session.user.name, mood, note: note || '', date },
    { upsert: true, new: true }
  );
  return NextResponse.json(entry);
}
