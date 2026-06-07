import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Memory from '@/lib/models/Memory';

export async function GET() {
  await connectDB();
  const memories = await Memory.find().sort({ date: -1 }).limit(50);
  return NextResponse.json(memories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, caption, imageData, date } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  await connectDB();
  const memory = await Memory.create({
    uploadedBy: (session.user as any).username,
    uploadedByDisplay: session.user.name,
    title: title.trim(),
    caption: caption?.trim() || '',
    imageData: imageData || '',
    date: date ? new Date(date) : new Date(),
  });
  return NextResponse.json(memory, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await connectDB();
  await Memory.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
