import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.10');

export async function POST(
  req: NextRequest,
  { params }: { params: { contractId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'BRAND') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.contractId },
      include: { escrowTransaction: true },
    });

    if (!contract) {
      return NextResponse.json({ message: 'Contrato no encontrado' }, { status: 404 });
    }

    if (contract.brandUserId !== session.user.id) {
      return NextResponse.json({ message: 'No tienes permiso' }, { status: 403 });
    }

    if (contract.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Solo contratos activos pueden fondearse' },
        { status: 400 },
      );
    }

    if (contract.escrowTransaction) {
      return NextResponse.json(
        { message: 'Este contrato ya tiene un escrow activo' },
        { status: 400 },
      );
    }

    const totalAmount = Number(contract.totalAmount);
    const platformFee = Math.round(totalAmount * platformFeePercent * 100) / 100;

    // Get or create Stripe customer
    const brandUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    let stripeCustomerId = brandUser?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: brandUser!.email,
        metadata: { userId: session.user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: contract.currency.toLowerCase(),
      customer: stripeCustomerId,
      metadata: { contractId: params.contractId, type: 'escrow' },
    });

    const escrow = await prisma.escrowTransaction.create({
      data: {
        contractId: params.contractId,
        brandUserId: session.user.id,
        creatorUserId: contract.creatorUserId,
        totalAmount,
        platformFee,
        currency: contract.currency,
        status: 'PENDING_DEPOSIT',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      escrow,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating escrow:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear escrow' },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { contractId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.contractId },
    });

    if (!contract) {
      return NextResponse.json({ message: 'Contrato no encontrado' }, { status: 404 });
    }

    if (contract.brandUserId !== session.user.id && contract.creatorUserId !== session.user.id) {
      return NextResponse.json({ message: 'No tienes acceso' }, { status: 403 });
    }

    const escrow = await prisma.escrowTransaction.findUnique({
      where: { contractId: params.contractId },
      include: {
        payments: {
          orderBy: { initiatedAt: 'desc' },
          include: {
            milestone: { select: { id: true, title: true, orderIndex: true } },
          },
        },
      },
    });

    if (!escrow) {
      return NextResponse.json({ message: 'No hay escrow para este contrato' }, { status: 404 });
    }

    return NextResponse.json(escrow);
  } catch (error: any) {
    console.error('Error fetching escrow:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener escrow' },
      { status: 500 },
    );
  }
}
