'use server';

import { hash } from 'bcryptjs';
import { prisma } from '@markinflu/database';
import { UserRole, AccountStatus } from '@markinflu/database';

interface RegisterInput {
  email: string;
  password: string;
  role: 'BRAND' | 'CREATOR' | 'AGENCY';
}

interface RegisterResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Ya existe una cuenta con este email',
      };
    }

    // Hash password
    const passwordHash = await hash(input.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role as UserRole,
        status: AccountStatus.PENDING_VERIFICATION,
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, user.id);

    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Error al crear la cuenta. Por favor intenta de nuevo.',
    };
  }
}
