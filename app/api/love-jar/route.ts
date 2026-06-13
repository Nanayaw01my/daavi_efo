import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LoveNote from '@/lib/models/LoveNote';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const username = (session.user as any).username;
  await connectDB();

  const myNotes = await LoveNote.find({ senderUsername: username }).sort({ createdAt: -1 });
  const partnerNotes = await LoveNote.find({ senderUsername: { $ne: username } }).sort({ createdAt: 1 });

  return NextResponse.json({ myNotes, partnerNotes });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const username = (session.user as any).username;
  const displayName = username === 'efo' ? 'Efo' : 'Daavi';

  await connectDB();
  const note = await LoveNote.create({
    senderUsername: username,
    senderDisplay: displayName,
    message: message.trim(),
  });

  return NextResponse.json(note, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { noteId } = await req.json();
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 });

  const username = (session.user as any).username;
  await connectDB();

  const note = await LoveNote.findById(noteId);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only the partner (recipient) can mark it as opened
  if (note.senderUsername === username) {
    return NextResponse.json({ error: 'Cannot open your own note' }, { status: 403 });
  }

  note.opened = true;
  note.openedAt = new Date();
  await note.save();

  return NextResponse.json(note);
}
