import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CoupleGoal from '@/lib/models/CoupleGoal';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const goals = await CoupleGoal.find().sort({ createdAt: 1 });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });

  const username = (session.user as any).username;
  const displayName = username === 'efo' ? 'Efo' : 'Daavi';

  await connectDB();
  const goal = await CoupleGoal.create({
    text: text.trim(),
    addedBy: username,
    addedByDisplay: displayName,
  });

  return NextResponse.json(goal, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goalId } = await req.json();
  if (!goalId) return NextResponse.json({ error: 'goalId required' }, { status: 400 });

  const username = (session.user as any).username;
  await connectDB();

  const goal = await CoupleGoal.findById(goalId);
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  goal.completed = !goal.completed;
  goal.completedBy = goal.completed ? username : null;
  await goal.save();

  return NextResponse.json(goal);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goalId } = await req.json();
  if (!goalId) return NextResponse.json({ error: 'goalId required' }, { status: 400 });

  const username = (session.user as any).username;
  await connectDB();

  const goal = await CoupleGoal.findById(goalId);
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (goal.addedBy !== username) {
    return NextResponse.json({ error: 'Can only delete your own goals' }, { status: 403 });
  }

  await CoupleGoal.findByIdAndDelete(goalId);
  return NextResponse.json({ ok: true });
}
