import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import PickNumber from '@/lib/models/PickNumber';
import { PICK_NUMBER_QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const count = await PickNumber.countDocuments();
  if (count === 0) {
    await PickNumber.insertMany(PICK_NUMBER_QUESTIONS);
  }
  const questions = await PickNumber.find().sort({ number: 1 });
  return NextResponse.json(questions);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { number, efoAnswer, daaviAnswer } = await req.json();
  await connectDB();

  const update: Record<string, string | boolean | Date> = { isAnswered: true, answeredAt: new Date() };
  const username = (session.user as any).username;
  if (username === 'efo' && efoAnswer !== undefined) update.efoAnswer = efoAnswer;
  if (username === 'daavi' && daaviAnswer !== undefined) update.daaviAnswer = daaviAnswer;
  if (username === 'admin') {
    if (efoAnswer !== undefined) update.efoAnswer = efoAnswer;
    if (daaviAnswer !== undefined) update.daaviAnswer = daaviAnswer;
  }

  const q = await PickNumber.findOneAndUpdate({ number }, { $set: update }, { new: true });
  return NextResponse.json(q);
}
