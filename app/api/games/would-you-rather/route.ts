import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import WYR from '@/lib/models/WouldYouRather';
import { WOULD_YOU_RATHER } from '@/lib/questions';

export const dynamic = 'force-dynamic';

async function ensureQuestions() {
  const count = await WYR.countDocuments();
  if (count === 0) {
    await WYR.insertMany(WOULD_YOU_RATHER.map(q => ({ questionId: q.id, optionA: q.a, optionB: q.b })));
  }
}

export async function GET() {
  await connectDB();
  await ensureQuestions();
  const questions = await WYR.find().sort({ questionId: 1 });
  return NextResponse.json(questions);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { questionId, choice } = await req.json();
  const username = (session.user as any).username;
  const field = username === 'efo' ? 'efoChoice' : 'daaviChoice';

  await connectDB();
  const q = await WYR.findOneAndUpdate({ questionId }, { $set: { [field]: choice } }, { new: true });
  return NextResponse.json(q);
}
