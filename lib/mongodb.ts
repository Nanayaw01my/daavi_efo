import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) throw new Error('Please define MONGODB_URI');

declare global {
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
  var _adminSeeded: boolean;
}

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function ensureAdmin() {
  if (global._adminSeeded) return;
  try {
    const bcrypt = (await import('bcryptjs')).default;
    const { default: User } = await import('./models/User');
    const password = process.env.ADMIN_PASSWORD || 'Admin@2024';
    const hash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { username: 'admin' },
      { username: 'admin', displayName: 'Admin', password: hash, role: 'admin' },
      { upsert: true, new: true }
    );
    global._adminSeeded = true;
  } catch {
    // will retry on next request
  }
}

async function connectDB() {
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  if (!cached.conn) {
    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }
  }
  // Always run until seeded — covers cached connections too
  if (!global._adminSeeded) await ensureAdmin();
  return cached.conn;
}

export default connectDB;
