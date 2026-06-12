import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Call from '@/lib/models/Call';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(null);
  await connectDB();
  const call = await Call.findOne({ status: { $in: ['ringing', 'active'] } }).sort({ createdAt: -1 });
  return NextResponse.json(call);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const username = (session.user as any).username as string;
    const displayName = username === 'efo' ? 'Efo' : 'Daavi';

    const body = await req.json();
    await connectDB();

    if (body.action === 'initiate') {
      await Call.updateMany({ status: { $in: ['ringing', 'active'] } }, { $set: { status: 'ended', endedAt: new Date() } });
      const call = await Call.create({ callerUsername: username, callerDisplay: displayName, type: body.type });

      // Try to send push to partner
      try {
        const { sendPushToUser } = await import('@/lib/push');
        const partnerUsername = username === 'efo' ? 'daavi' : 'efo';
        sendPushToUser(partnerUsername, {
          title: `${displayName} is calling 📞`,
          body: body.type === 'video' ? 'Video call — tap to answer' : 'Audio call — tap to answer',
          url: '/',
          tag: 'call',
        });
      } catch { /* push is best-effort */ }

      return NextResponse.json(call);
    }

    if (body.action === 'offer') {
      const call = await Call.findByIdAndUpdate(body.callId, { $set: { offer: body.offer } }, { new: true });
      return NextResponse.json(call);
    }

    if (body.action === 'answer') {
      const call = await Call.findByIdAndUpdate(body.callId, { $set: { answer: body.answer, status: 'active' } }, { new: true });
      return NextResponse.json(call);
    }

    if (body.action === 'reject') {
      const call = await Call.findByIdAndUpdate(body.callId, { $set: { status: 'rejected', endedAt: new Date() } }, { new: true });
      return NextResponse.json(call);
    }

    if (body.action === 'end') {
      const call = await Call.findByIdAndUpdate(body.callId, { $set: { status: 'ended', endedAt: new Date() } }, { new: true });
      return NextResponse.json(call);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
