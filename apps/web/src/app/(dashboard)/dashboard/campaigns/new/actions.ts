'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import { revalidatePath } from 'next/cache';

export async function createCampaign(data: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'BRAND') {
      throw new Error('No autorizado');
    }

    // Get brand profile
    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      throw new Error('Perfil de marca no encontrado');
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: data.description,
        status: 'DRAFT',
        visibility: data.visibility || 'PUBLIC',
        brandProfileId: brandProfile.id,

        // Brief
        brief: {
          objective: data.objectives,
          targetAudience: data.targetAudience,
        },

        // Requirements
        requirements: {
          platforms: data.platforms,
          contentTypes: data.contentTypes,
        },

        // Budget
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        currency: data.currency || 'USD',
        budgetType: data.budgetType || 'PER_CREATOR',

        // Dates
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,

        // Deliverables specs
        deliverableSpecs: {
          hashtags: data.hashtags || [],
          mentions: data.mentions || [],
          guidelines: data.guidelines,
          dos: data.dos || [],
          donts: data.donts || [],
        },

        maxCreators: data.maxCreators || 10,
      },
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true, data: campaign };
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return { success: false, error: error.message };
  }
}

export async function publishCampaign(campaignId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'BRAND') {
      throw new Error('No autorizado');
    }

    // Get campaign to verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brandProfile: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }

    if (campaign.brandProfile.userId !== session.user.id) {
      throw new Error('No tienes permiso para publicar esta campaña');
    }

    // Update status to PUBLISHED
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'PUBLISHED',
      },
    });

    revalidatePath('/dashboard/campaigns');
    revalidatePath('/dashboard/opportunities');
    return { success: true, data: updatedCampaign };
  } catch (error: any) {
    console.error('Error publishing campaign:', error);
    return { success: false, error: error.message };
  }
}
