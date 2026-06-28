import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import LinkedIn from 'next-auth/providers/linkedin';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/server/db/connect';
import { UserModel } from '@/server/db/models';
import { LoginSchema } from '@/server/validators';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const parsed = LoginSchema.safeParse(credentials);
          if (!parsed.success) return null;
          await connectDB();
          const user = await UserModel.findOne({ email: parsed.data.email }).lean() as any;
          if (!user || !user.password) return null;
          const valid = await bcrypt.compare(parsed.data.password, user.password);
          if (!valid) return null;
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatar,
            color: user.color,
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).color = token.color;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Subsequent requests — no user/account, just return token as-is
      if (!user) return token;

      // Credentials login — user.id is already our MongoDB _id
      if (!account || account.provider === 'credentials') {
        token.id = user.id;
        token.color = (user as any).color;
        return token;
      }

      // OAuth login — find or create our DB user by email
      if (user.email) {
        await connectDB();
        let dbUser = await UserModel.findOne({ email: user.email }).lean() as any;
        if (!dbUser) {
          const created = await UserModel.create({
            name: user.name || user.email.split('@')[0],
            email: user.email,
            avatar: user.image ?? undefined,
          });
          dbUser = { _id: created._id, color: created.color };
        }
        token.id = dbUser._id.toString();
        token.color = dbUser.color;
      }
      return token;
    },
  },
});
