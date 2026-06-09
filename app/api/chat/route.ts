import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/lib/models/ChatMessage';

export const dynamic = 'force-dynamic';

// GET: last 100 messages, oldest first
export async function GET() {
  await connectDB();
  const messages = await ChatMessage.find().sort({ createdAt: 1 }).limit(100);
  return NextResponse.json(messages);
}

// POST: send a message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  const username = (session.user as any).username as string;
  const senderDisplay = username === 'efo' ? 'Efo' : username === 'daavi' ? 'Daavi' : 'Admin';
  await connectDB();
  const msg = await ChatMessage.create({ sender: username, senderDisplay, content: content.trim() });
  return NextResponse.json(msg);
}

// DELETE: clear all messages (admin)
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  await ChatMessage.deleteMany({});
  return NextResponse.json({ ok: true });
}
