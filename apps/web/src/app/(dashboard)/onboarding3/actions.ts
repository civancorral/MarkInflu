'use server';

import { prisma } from '@markinflu/database';
import { SocialPlatform, ContentType } from '@markinflu/database';

interface CreatorProfileData {
  displayName: string;
  bio?: string;
  tagline?: string;
  country: string;
  city?: string;
  timezone?: string;
  languages: string[];
  primaryNiche: string;
  secondaryNiches: string[];
  contentTypes: string[];
  minimumBudget?: number;
  currency?: string;
  instagramUsername?: string;
  youtubeUsername?: string;
  tiktokUsername?: string;
}

interface BrandProfileData {
  companyName: string;
  description?: string;
  website?: string;
  industry: string[];
  companySize: string;
  country: string;
}

export async function createCreatorProfile(userId: string, data: CreatorProfileData) {
  try {
    // Check if profile already exists
    const existing = await prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return { error: 'Ya tienes un perfil de creador' };
    }

    // Create profile
    const profile = await prisma.creatorProfile.create({
      data: {
        userId,
        displayName: data.displayName,
        bio: data.bio,
        tagline: data.tagline,
        country: data.country,
        city: data.city,
        timezone: data.timezone,
        languages: data.languages,
        primaryNiche: data.primaryNiche,
        secondaryNiches: data.secondaryNiches,
        contentTypes: data.contentTypes as ContentType[],
        minimumBudget: data.minimumBudget,
        currency: data.currency || 'USD',
      },
    });

    // Create social accounts if provided
    const socialAccounts = [];

    if (data.instagramUsername) {
      socialAccounts.push({
        creatorProfileId: profile.id,
        platform: SocialPlatform.INSTAGRAM,
        username: data.instagramUsername,
        profileUrl: `https://instagram.com/${data.instagramUsername}`,
      });
    }

    if (data.youtubeUsername) {
      socialAccounts.push({
        creatorProfileId: profile.id,
        platform: SocialPlatform.YOUTUBE,
        username: data.youtubeUsername,
        profileUrl: `https://youtube.com/@${data.youtubeUsername}`,
      });
    }

    if (data.tiktokUsername) {
      socialAccounts.push({
        creatorProfileId: profile.id,
        platform: SocialPlatform.TIKTOK,
        username: data.tiktokUsername,
        profileUrl: `https://tiktok.com/@${data.tiktokUsername}`,
      });
    }

    if (socialAccounts.length > 0) {
      await prisma.socialAccount.createMany({
        data: socialAccounts,
      });
    }

    // Update user status to ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    return { success: true, profileId: profile.id };
  } catch (error) {
    console.error('Error creating creator profile:', error);
    return { error: 'Error al crear el perfil' };
  }
}

export async function createBrandProfile(userId: string, data: BrandProfileData) {
  try {
    // Check if profile already exists
    const existing = await prisma.brandProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return { error: 'Ya tienes un perfil de marca' };
    }

    // Create profile
    const profile = await prisma.brandProfile.create({
      data: {
        userId,
        companyName: data.companyName,
        website: data.website,
        industry: data.industry,
        companySize: data.companySize as any,
      },
    });

    // Update user status to ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    return { success: true, profileId: profile.id };
  } catch (error) {
    console.error('Error creating brand profile:', error);
    return { error: 'Error al crear el perfil' };
  }
}
