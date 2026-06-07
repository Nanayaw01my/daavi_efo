import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Note from '@/lib/models/Note';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const notes = await Note.find().sort({ pinned: -1, createdAt: -1 }).limit(50);
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content, type } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  await connectDB();
  const note = await Note.create({
    author: (session.user as any).username,
    authorDisplay: session.user.name,
    content: content.trim(),
    type: type || 'message',
  });
  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await connectDB();
  const note = await Note.findById(id);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const role = (session.user as any).role;
  if (note.author !== (session.user as any).username && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await Note.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
