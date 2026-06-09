import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PushSub from '@/lib/models/PushSubscription';
import { VAPID_PUBLIC } from '@/lib/push';

export const dynamic = 'force-dynamic';

// GET: return the VAPID public key so the client can subscribe
export async function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC });
}

// POST: save a push subscription for the logged-in user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = (session.user as any).username as string;

  const body = await req.json();
  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await connectDB();
  await PushSub.findOneAndUpdate(
    { endpoint },
    { username, endpoint, keys },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

// DELETE: remove a push subscription (user disabled notifications)
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.endpoint) {
    await connectDB();
    await PushSub.deleteOne({ endpoint: body.endpoint });
  }
  return NextResponse.json({ ok: true });
}
