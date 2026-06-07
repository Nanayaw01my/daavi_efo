import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reflection from '@/lib/models/Reflection';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const weeks = await Reflection.aggregate([
    { $group: { _id: '$week', weekLabel: { $first: '$weekLabel' }, count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 20 },
  ]);
  return NextResponse.json(weeks);
}
