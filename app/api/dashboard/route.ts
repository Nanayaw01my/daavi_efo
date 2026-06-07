import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import connectDB from '@/lib/mongodb';
import Note from '@/lib/models/Note';
import Memory from '@/lib/models/Memory';
import Mood from '@/lib/models/Mood';
import Reflection from '@/lib/models/Reflection';
import PickNumber from '@/lib/models/PickNumber';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [noteCount, memoryCount, moodToday, recentMemory, answeredGames, reflectionCount] = await Promise.all([
    Note.countDocuments(),
    Memory.countDocuments(),
    Mood.find({ date: today }),
    Memory.findOne().sort({ createdAt: -1 }),
    PickNumber.countDocuments({ isAnswered: true }),
    Reflection.countDocuments(),
  ]);

  return NextResponse.json({ noteCount, memoryCount, moodToday, recentMemory, answeredGames, reflectionCount });
}
