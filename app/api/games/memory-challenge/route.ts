import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import MemoryChallenge from '@/lib/models/MemoryChallenge';
import { MEMORY_CHALLENGE_QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

async function ensure() {
  const count = await MemoryChallenge.countDocuments();
  if (count === 0) {
    await MemoryChallenge.insertMany(MEMORY_CHALLENGE_QUESTIONS.map(q => ({ questionId: q.id })));
  }
}

export async function GET() {
  await connectDB();
  await ensure();
  const answers = await MemoryChallenge.find().sort({ questionId: 1 });
  return NextResponse.json(answers);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { questionId, answer } = await req.json();
  const username = (session.user as any).username;
  const field = username === 'efo' ? 'efoAnswer' : 'daaviAnswer';

  await connectDB();
  const q = await MemoryChallenge.findOneAndUpdate(
    { questionId },
    { $set: { [field]: answer } },
    { new: true, upsert: true }
  );
  return NextResponse.json(q);
}

export async function DELETE() {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  await MemoryChallenge.updateMany({}, { $set: { efoAnswer: -1, daaviAnswer: -1 } });
  return NextResponse.json({ ok: true });
}
