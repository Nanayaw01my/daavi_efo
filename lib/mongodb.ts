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
    // Dynamic imports to avoid circular deps at module load time
    const bcrypt = (await import('bcryptjs')).default;
    const { default: User } = await import('./models/User');
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const password = process.env.ADMIN_PASSWORD || 'Admin@2024';
      const hash = await bcrypt.hash(password, 12);
      await User.create({ username: 'admin', displayName: 'Admin', password: hash, role: 'admin' });
    }
    global._adminSeeded = true;
  } catch {
    // Non-fatal — will retry on next request
  }
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  ensureAdmin(); // fire-and-forget after connection
  return cached.conn;
}

export default connectDB;
