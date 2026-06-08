import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SavedDate from '@/lib/models/SavedDate';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const saved = await SavedDate.find().sort({ createdAt: -1 });
  return NextResponse.json(saved);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ideaId, idea, category, emoji } = await req.json();
  await connectDB();

  const existing = await SavedDate.findOne({ ideaId });
  if (existing) return NextResponse.json({ error: 'Already saved' }, { status: 400 });

  const saved = await SavedDate.create({
    ideaId, idea, category, emoji,
    savedBy: (session.user as any).username,
  });
  return NextResponse.json(saved, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, completed, scheduledFor } = await req.json();
  await connectDB();
  const update: any = {};
  if (completed !== undefined) update.completed = completed;
  if (scheduledFor !== undefined) update.scheduledFor = scheduledFor;

  const d = await SavedDate.findByIdAndUpdate(id, { $set: update }, { new: true });
  return NextResponse.json(d);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await connectDB();
  await SavedDate.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
