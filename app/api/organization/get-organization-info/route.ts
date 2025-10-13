import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('id');

    let organization;

    if (orgId) {
      organization = await prisma.organization.findUnique({
        where: { id: orgId },
      });
    } else {
      organization = await prisma.organization.findMany();
    }

    if (!organization) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: organization });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
