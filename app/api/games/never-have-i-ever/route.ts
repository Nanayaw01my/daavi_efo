import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import NHIEModel from '@/lib/models/NeverHaveIEver';
import { NEVER_HAVE_I_EVER_STATEMENTS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

async function ensureStatements() {
  const count = await NHIEModel.countDocuments();
  if (count === 0) {
    await NHIEModel.insertMany(
      NEVER_HAVE_I_EVER_STATEMENTS.map(s => ({ statementId: s.id, statement: s.statement }))
    );
  }
}

export async function GET() {
  await connectDB();
  await ensureStatements();
  const statements = await NHIEModel.find().sort({ statementId: 1 });
  return NextResponse.json(statements);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { statementId, have } = await req.json();
  const username = (session.user as any).username;
  const field = username === 'efo' ? 'efoHave' : 'daaviHave';

  await connectDB();
  const s = await NHIEModel.findOneAndUpdate(
    { statementId },
    { $set: { [field]: have } },
    { new: true }
  );
  return NextResponse.json(s);
}

export async function DELETE() {
  await connectDB();
  await NHIEModel.updateMany({}, { $set: { efoHave: null, daaviHave: null } });
  return NextResponse.json({ ok: true });
}
