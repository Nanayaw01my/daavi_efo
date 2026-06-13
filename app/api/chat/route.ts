import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/lib/models/ChatMessage';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const messages = await ChatMessage.find().sort({ createdAt: 1 }).limit(100);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { content, type, audioData } = body;
  const username = (session.user as any).username as string;
  const senderDisplay = username === 'efo' ? 'Efo' : username === 'daavi' ? 'Daavi' : 'Admin';
  await connectDB();

  if (type === 'audio') {
    const msg = await ChatMessage.create({
      sender: username, senderDisplay,
      content: '🎤 Voice message', type: 'audio', audioData,
    });
    const partner = username === 'efo' ? 'daavi' : 'efo';
    sendPushToUser(partner, { title: `${senderDisplay} 💬`, body: '🎤 Voice message', url: '/chat', tag: 'chat' });
    return NextResponse.json(msg);
  }

  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  const msg = await ChatMessage.create({ sender: username, senderDisplay, content: content.trim() });

  const partner = username === 'efo' ? 'daavi' : 'efo';
  const preview = content.trim().length > 60 ? content.trim().slice(0, 60) + '…' : content.trim();
  sendPushToUser(partner, { title: `${senderDisplay} 💬`, body: preview, url: '/chat', tag: 'chat' });

  return NextResponse.json(msg);
}

// Edit own text message
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = (session.user as any).username as string;
  const { messageId, content } = await req.json();
  if (!messageId || !content?.trim()) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  await connectDB();
  const msg = await ChatMessage.findById(messageId);
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (msg.sender !== username) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  msg.content = content.trim();
  msg.edited = true;
  await msg.save();
  return NextResponse.json(msg);
}

// Delete a message (own) or all (admin)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = (session.user as any).username as string;

  let body: any = null;
  try { body = await req.json(); } catch {}

  if (body?.messageId) {
    await connectDB();
    const msg = await ChatMessage.findById(body.messageId);
    if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (msg.sender !== username && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await msg.deleteOne();
    return NextResponse.json({ ok: true });
  }

  if ((session.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  await ChatMessage.deleteMany({});
  return NextResponse.json({ ok: true });
}
