import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.stripeConnectId) {
      return NextResponse.json({
        status: 'NOT_CONNECTED',
        detailsSubmitted: false,
        payoutsEnabled: false,
      });
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectId);

    const newStatus = account.details_submitted
      ? account.payouts_enabled
        ? 'ACTIVE'
        : 'RESTRICTED'
      : 'PENDING';

    if (newStatus !== user.stripeConnectStatus) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectStatus: newStatus as any },
      });
    }

    return NextResponse.json({
      status: newStatus,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
    });
  } catch (error: any) {
    console.error('Error fetching connect status:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener estado' },
      { status: 500 },
    );
  }
}
