import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Note from '@/lib/models/Note';
import Memory from '@/lib/models/Memory';
import Mood from '@/lib/models/Mood';
import Reflection from '@/lib/models/Reflection';
import PickNumber from '@/lib/models/PickNumber';

export const dynamic = 'force-dynamic';

async function requireAdmin(session: any) {
  return session?.user?.role === 'admin';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!await requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectDB();
  const [users, noteCount, memoryCount, reflectionCount, moodCount, gamesAnswered] = await Promise.all([
    User.find({}, '-password'),
    Note.countDocuments(),
    Memory.countDocuments(),
    Reflection.countDocuments(),
    Mood.countDocuments(),
    PickNumber.countDocuments({ isAnswered: true }),
  ]);

  return NextResponse.json({ users, stats: { noteCount, memoryCount, reflectionCount, moodCount, gamesAnswered } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!await requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action, userId, newPassword, collection } = await req.json();
  await connectDB();

  if (action === 'resetPassword') {
    const hash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { password: hash });
    return NextResponse.json({ ok: true });
  }

  if (action === 'clearCollection') {
    const map: Record<string, any> = { notes: Note, memories: Memory, moods: Mood, reflections: Reflection };
    if (map[collection]) await map[collection].deleteMany({});
    return NextResponse.json({ ok: true });
  }

  if (action === 'resetPickNumber') {
    await PickNumber.updateMany({}, { $set: { efoAnswer: '', daaviAnswer: '', isAnswered: false } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
