import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
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
          if (!user) return null;
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
  ],
});
