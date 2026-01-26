import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@markinflu/database';
import { UserRole } from '@markinflu/database';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      brandProfileId?: string;
      creatorProfileId?: string;
      agencyProfileId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    brandProfileId?: string;
    creatorProfileId?: string;
    agencyProfileId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    brandProfileId?: string;
    creatorProfileId?: string;
    agencyProfileId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/onboarding',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            brandProfile: { select: { id: true } },
            creatorProfile: { select: { id: true } },
            agencyProfile: { select: { id: true } },
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Credenciales inválidas');
        }

        if (user.status === 'SUSPENDED') {
          throw new Error('Tu cuenta ha sido suspendida');
        }

        if (user.status === 'DEACTIVATED') {
          throw new Error('Tu cuenta ha sido desactivada');
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Credenciales inválidas');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          brandProfileId: user.brandProfile?.id,
          creatorProfileId: user.creatorProfile?.id,
          agencyProfileId: user.agencyProfile?.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.brandProfileId = user.brandProfileId;
        token.creatorProfileId = user.creatorProfileId;
        token.agencyProfileId = user.agencyProfileId;
      }

      // Handle session update (e.g., after profile creation)
      if (trigger === 'update' && session) {
        token.brandProfileId = session.brandProfileId;
        token.creatorProfileId = session.creatorProfileId;
        token.agencyProfileId = session.agencyProfileId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          role: token.role,
          brandProfileId: token.brandProfileId,
          creatorProfileId: token.creatorProfileId,
          agencyProfileId: token.agencyProfileId,
        };
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
  },
};
