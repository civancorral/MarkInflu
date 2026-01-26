import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const contractId = params.id;

    // Get contract with full details
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        campaign: {
          include: {
            brandProfile: {
              select: {
                companyName: true,
                logoUrl: true,
                industry: true,
                website: true,
              },
            },
          },
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
        deliverables: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { message: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Verify access (only creator who owns the contract or brand owner)
    if (session.user.role === 'CREATOR') {
      if (contract.creatorUserId !== session.user.id) {
        return NextResponse.json(
          { message: 'No tienes acceso a este contrato' },
          { status: 403 }
        );
      }
    }

    // Format response
    const formattedContract = {
      id: contract.id,
      status: contract.status,
      totalAmount: contract.totalAmount?.toString(),
      currency: contract.currency,
      startDate: contract.startDate,
      endDate: contract.endDate,
      terms: contract.terms,
      createdAt: contract.createdAt,
      signedAt: contract.signedAt,
      completedAt: contract.completedAt,
      cancelledAt: contract.cancelledAt,
      cancellationReason: contract.cancellationReason,
      campaign: {
        id: contract.campaign.id,
        title: contract.campaign.title,
        slug: contract.campaign.slug,
        description: contract.campaign.description,
        brief: contract.campaign.brief,
        deliverableSpecs: contract.campaign.deliverableSpecs,
        brand: {
          name: contract.campaign.brandProfile.companyName,
          logo: contract.campaign.brandProfile.logoUrl,
          industry: contract.campaign.brandProfile.industry,
          website: contract.campaign.brandProfile.website,
        },
      },
      milestones: contract.milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount?.toString(),
        dueDate: milestone.dueDate,
        status: milestone.status,
        completedAt: milestone.completedAt,
        paidAt: milestone.paidAt,
      })),
      deliverables: contract.deliverables.map((deliverable) => ({
        id: deliverable.id,
        title: deliverable.title,
        description: deliverable.description,
        type: deliverable.type,
        status: deliverable.status,
        dueDate: deliverable.dueDate,
        submittedAt: deliverable.submittedAt,
        approvedAt: deliverable.approvedAt,
      })),
    };

    return NextResponse.json(formattedContract);
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener contrato' },
      { status: 500 }
    );
  }
}
