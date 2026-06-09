import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import TruthDareRound from '@/lib/models/TruthDareRound';

export const dynamic = 'force-dynamic';

// GET: current round + history
export async function GET() {
  await connectDB();
  const current = await TruthDareRound.findOne({ status: { $ne: 'done' } }).sort({ roundNumber: -1 });
  const history = await TruthDareRound.find({ status: 'done' }).sort({ roundNumber: -1 }).limit(20);
  return NextResponse.json({ current, history });
}

// POST: game actions
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = (session.user as any).username as string;
  const body = await req.json();
  await connectDB();

  // action: 'start' — asker challenges their partner
  if (body.action === 'start') {
    const existing = await TruthDareRound.findOne({ status: { $ne: 'done' } });
    if (existing) return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    const responder = username === 'efo' ? 'daavi' : 'efo';
    const round = await TruthDareRound.create({
      roundNumber: 1,
      asker: username,
      responder,
      status: 'pending',
    });
    return NextResponse.json(round);
  }

  // action: 'pick' — RESPONDER picks truth or dare
  if (body.action === 'pick') {
    const round = await TruthDareRound.findOne({ status: 'pending' });
    if (!round) return NextResponse.json({ error: 'No active challenge' }, { status: 404 });
    if (round.responder !== username) return NextResponse.json({ error: 'Not your pick to make' }, { status: 403 });
    round.type = body.type as 'truth' | 'dare';
    round.status = 'composing';
    await round.save();
    return NextResponse.json(round);
  }

  // action: 'send' — ASKER writes and sends their question
  if (body.action === 'send') {
    const round = await TruthDareRound.findOne({ status: 'composing' });
    if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
    if (round.asker !== username) return NextResponse.json({ error: 'Not your question to write' }, { status: 403 });
    const prompt = (body.prompt as string | undefined)?.trim();
    if (!prompt) return NextResponse.json({ error: 'Question cannot be empty' }, { status: 400 });
    round.prompt = prompt;
    round.status = 'answering';
    await round.save();
    return NextResponse.json(round);
  }

  // action: 'respond' — RESPONDER submits their answer
  if (body.action === 'respond') {
    const round = await TruthDareRound.findOne({ status: 'answering' });
    if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
    if (round.responder !== username) return NextResponse.json({ error: 'Not your turn to respond' }, { status: 403 });
    round.response = body.response;
    round.status = 'done';
    await round.save();
    // Next round — roles swap
    const nextRound = await TruthDareRound.create({
      roundNumber: round.roundNumber + 1,
      asker: round.responder,
      responder: round.asker,
      status: 'pending',
    });
    return NextResponse.json({ completedRound: round, nextRound });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// DELETE: reset game
export async function DELETE() {
  await connectDB();
  await TruthDareRound.deleteMany({});
  return NextResponse.json({ ok: true });
}
