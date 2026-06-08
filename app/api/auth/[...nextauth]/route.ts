import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const username = credentials.username.toLowerCase().trim();
        const password = credentials.password;

        // Admin: verify directly against env var — no DB lookup required
        if (username === 'admin') {
          const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024';
          if (password !== adminPassword) return null;
          // Upsert admin record so other parts of app can reference it
          try {
            await connectDB();
            const hash = await bcrypt.hash(adminPassword, 10);
            await User.findOneAndUpdate(
              { username: 'admin' },
              { username: 'admin', displayName: 'Admin', password: hash, role: 'admin' },
              { upsert: true, new: true }
            );
          } catch { /* non-fatal */ }
          return { id: 'admin', username: 'admin', name: 'Admin', role: 'admin' };
        }

        // Efo / Daavi: normal DB lookup
        await connectDB();
        const user = await User.findOne({ username });
        if (!user) return null;
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        return {
          id: user._id.toString(),
          username: user.username,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
