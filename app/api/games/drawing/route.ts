import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DrawingRound from '@/lib/models/DrawingRound';
import { randomPrompt } from '@/lib/drawingPrompts';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

async function scoreDrawing(imageData: string, prompt: string): Promise<{ score: number; feedback: string }> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const client = new Anthropic({ apiKey });

    // Strip the data URL prefix to get raw base64
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: base64 },
          },
          {
            type: 'text',
            text: `The drawing prompt was: "${prompt}". Score this drawing 1-10 (be fun and encouraging, not harsh). Reply in exactly this format:\nSCORE: [number]\nFEEDBACK: [one fun sentence, max 12 words]`,
          },
        ],
      }],
    });

    const text = (msg.content[0] as any).text as string;
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i);
    return {
      score: scoreMatch ? Math.min(10, Math.max(1, parseInt(scoreMatch[1]))) : 7,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : 'Great effort! 🎨',
    };
  } catch {
    // Fallback: fun score based on image size (proxy for drawing effort)
    const bytes = imageData.length;
    const score = bytes < 5000 ? 5 : bytes < 20000 ? 7 : bytes < 50000 ? 8 : 9;
    const fallbacks = [
      'A masterpiece in the making! 🎨',
      'Picasso would be proud! 🖼️',
      'Pure artistic genius! ✨',
      'A work of heart! 💕',
      'Stunning creativity! 🌟',
    ];
    return { score, feedback: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const round = await DrawingRound.findOne({ status: { $in: ['active', 'scoring', 'done'] } }).sort({ createdAt: -1 });
    return NextResponse.json(round);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const username = (session.user as any).username as string;
    const displayName = session.user.name as string;

    const body = await req.json();
    const { action } = body;

    await connectDB();

    if (action === 'start') {
      // Archive any existing active round
      await DrawingRound.updateMany({ status: 'active' }, { $set: { status: 'done' } });
      const round = await DrawingRound.create({
        prompt: randomPrompt(),
        startedAt: new Date(),
        durationSeconds: 90,
        drawings: [],
      });
      return NextResponse.json(round);
    }

    if (action === 'submit') {
      const { roundId, imageData } = body;
      const round = await DrawingRound.findById(roundId);
      if (!round || round.status === 'done') return NextResponse.json({ error: 'Round not found or already done' }, { status: 400 });

      // Upsert this user's drawing
      const idx = round.drawings.findIndex((d: any) => d.username === username);
      const entry = { username, displayName, imageData, submittedAt: new Date(), score: null, feedback: '' };
      if (idx >= 0) round.drawings[idx] = entry;
      else round.drawings.push(entry);

      // If both submitted, score them
      if (round.drawings.length >= 2) {
        round.status = 'scoring';
        await round.save();

        // Score both drawings concurrently
        const [r0, r1] = await Promise.all([
          scoreDrawing(round.drawings[0].imageData, round.prompt),
          scoreDrawing(round.drawings[1].imageData, round.prompt),
        ]);
        round.drawings[0].score = r0.score;
        round.drawings[0].feedback = r0.feedback;
        round.drawings[1].score = r1.score;
        round.drawings[1].feedback = r1.feedback;
        round.status = 'done';
        await round.save();
      } else {
        await round.save();
      }

      return NextResponse.json(round);
    }

    if (action === 'new') {
      await DrawingRound.updateMany({}, { $set: { status: 'done' } });
      const round = await DrawingRound.create({
        prompt: randomPrompt(),
        startedAt: new Date(),
        durationSeconds: 90,
        drawings: [],
      });
      return NextResponse.json(round);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
