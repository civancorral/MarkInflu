import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, role: true, status: true },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}
