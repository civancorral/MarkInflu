'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import { revalidatePath } from 'next/cache';
import { ContentType } from '@markinflu/database';

interface UpdateProfileData {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  tagline?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  location?: string;
  city?: string;
  country?: string;
  timezone?: string;
  languages?: string[];
  primaryNiche?: string;
  secondaryNiches?: string[];
  contentTypes?: string[];
  keywords?: string[];
  portfolioUrls?: string[];
  minimumBudget?: number;
  currency?: string;
  isAvailable?: boolean;
  availabilityNotes?: string;
  preferredBrands?: string[];
  excludedBrands?: string[];
}

export async function updateCreatorProfile(data: UpdateProfileData) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return { error: 'No autorizado' };
    }

    // Update profile
    const profile = await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: {
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio,
        tagline: data.tagline,
        avatarUrl: data.avatarUrl,
        coverImageUrl: data.coverImageUrl,
        location: data.location,
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        languages: data.languages,
        primaryNiche: data.primaryNiche,
        secondaryNiches: data.secondaryNiches,
        contentTypes: data.contentTypes as ContentType[],
        keywords: data.keywords,
        portfolioUrls: data.portfolioUrls,
        minimumBudget: data.minimumBudget,
        currency: data.currency,
        isAvailable: data.isAvailable,
        availabilityNotes: data.availabilityNotes,
        preferredBrands: data.preferredBrands,
        excludedBrands: data.excludedBrands,
      },
    });

    revalidatePath('/dashboard/profile');
    return { success: true, data: profile };
  } catch (error: any) {
    console.error('Error updating creator profile:', error);
    return { error: error.message || 'Error al actualizar perfil' };
  }
}

export async function updateRates(rates: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return { error: 'No autorizado' };
    }

    const profile = await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: { rates },
    });

    revalidatePath('/dashboard/profile');
    return { success: true, data: profile };
  } catch (error: any) {
    console.error('Error updating rates:', error);
    return { error: error.message || 'Error al actualizar tarifas' };
  }
}

export async function updatePortfolio(portfolioUrls: string[]) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return { error: 'No autorizado' };
    }

    const profile = await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: { portfolioUrls },
    });

    revalidatePath('/dashboard/profile');
    return { success: true, data: profile };
  } catch (error: any) {
    console.error('Error updating portfolio:', error);
    return { error: error.message || 'Error al actualizar portfolio' };
  }
}

export async function disconnectSocialAccount(platform: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return { error: 'No autorizado' };
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!creatorProfile) {
      return { error: 'Perfil no encontrado' };
    }

    await prisma.socialAccount.update({
      where: {
        creatorProfileId_platform: {
          creatorProfileId: creatorProfile.id,
          platform: platform as any,
        },
      },
      data: {
        accessToken: null,
        refreshToken: null,
        isConnected: false,
      },
    });

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error: any) {
    console.error('Error disconnecting social account:', error);
    return { error: error.message || 'Error al desconectar cuenta' };
  }
}

export async function updateAvailability(isAvailable: boolean, notes?: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return { error: 'No autorizado' };
    }

    const profile = await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: {
        isAvailable,
        availabilityNotes: notes,
      },
    });

    revalidatePath('/dashboard/profile');
    return { success: true, data: profile };
  } catch (error: any) {
    console.error('Error updating availability:', error);
    return { error: error.message || 'Error al actualizar disponibilidad' };
  }
}
