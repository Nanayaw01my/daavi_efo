import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import TruthDareRound from '@/lib/models/TruthDareRound';
import { TRUTH_PROMPTS, DARE_PROMPTS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

function randomFrom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// GET: current round + history
export async function GET() {
  await connectDB();
  const current = await TruthDareRound.findOne({ status: { $ne: 'done' } }).sort({ roundNumber: -1 });
  const history = await TruthDareRound.find({ status: 'done' }).sort({ roundNumber: -1 }).limit(20);
  return NextResponse.json({ current, history });
}

// POST: start game (creates round 1) OR choose truth/dare OR respond
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = (session.user as any).username as string;
  const body = await req.json();
  await connectDB();

  // action: 'start' — create first round, caller is asker
  if (body.action === 'start') {
    const existing = await TruthDareRound.findOne({ status: { $ne: 'done' } });
    if (existing) return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    const responder = username === 'efo' ? 'daavi' : 'efo';
    const round = await TruthDareRound.create({ roundNumber: 1, asker: username, responder, status: 'choosing' });
    return NextResponse.json(round);
  }

  // action: 'choose' — asker picks truth or dare → prompt auto-assigned
  if (body.action === 'choose') {
    const round = await TruthDareRound.findOne({ status: 'choosing' });
    if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
    if (round.asker !== username) return NextResponse.json({ error: 'Not your turn to choose' }, { status: 403 });
    const type = body.type as 'truth' | 'dare';
    const prompt = type === 'truth' ? randomFrom(TRUTH_PROMPTS) : randomFrom(DARE_PROMPTS);
    round.type = type;
    round.prompt = prompt;
    round.status = 'answering';
    await round.save();
    return NextResponse.json(round);
  }

  // action: 'respond' — responder submits answer → round done, new round created with swapped roles
  if (body.action === 'respond') {
    const round = await TruthDareRound.findOne({ status: 'answering' });
    if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
    if (round.responder !== username) return NextResponse.json({ error: 'Not your turn to respond' }, { status: 403 });
    round.response = body.response;
    round.status = 'done';
    await round.save();
    // Create next round with swapped roles
    const nextRound = await TruthDareRound.create({
      roundNumber: round.roundNumber + 1,
      asker: round.responder,
      responder: round.asker,
      status: 'choosing',
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
