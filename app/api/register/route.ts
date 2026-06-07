import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

const ALLOWED = ['efo', 'daavi'];

export async function POST(req: NextRequest) {
  try {
    const { username, password, displayName } = await req.json();
    const u = username?.toLowerCase().trim();

    if (!ALLOWED.includes(u)) {
      return NextResponse.json({ error: 'Only Efo and Daavi can register.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    await connectDB();
    const exists = await User.findOne({ username: u });
    if (exists) {
      return NextResponse.json({ error: `${displayName} already has an account. Please login.` }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);
    await User.create({ username: u, displayName: displayName || (u.charAt(0).toUpperCase() + u.slice(1)), password: hash, role: u });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
