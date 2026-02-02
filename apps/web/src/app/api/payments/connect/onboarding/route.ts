import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { returnUrl } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    let connectId = user.stripeConnectId;

    if (!connectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { userId: session.user.id },
        capabilities: { transfers: { requested: true } },
      });
      connectId = account.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectId: connectId, stripeConnectStatus: 'PENDING' },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Error creating connect onboarding:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear enlace de onboarding' },
      { status: 500 },
    );
  }
}
