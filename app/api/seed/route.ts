import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import PickNumber from '@/lib/models/PickNumber';
import { PICK_NUMBER_QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

async function seed() {
  await connectDB();

  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    const password = process.env.ADMIN_PASSWORD || 'Admin@2024';
    const hash = await bcrypt.hash(password, 12);
    await User.create({ username: 'admin', displayName: 'Admin', password: hash, role: 'admin' });
  }

  const count = await PickNumber.countDocuments();
  if (count === 0) {
    await PickNumber.insertMany(PICK_NUMBER_QUESTIONS);
  }

  return NextResponse.json({ ok: true, message: 'Seeded successfully' });
}

export async function POST() {
  try { return await seed(); } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}

export async function GET() {
  try { return await seed(); } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
