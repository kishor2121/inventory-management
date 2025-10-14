import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, organizationName, ownerName, description, address, billingRules } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Organization ID is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        organizationName,
        ownerName,
        description,
        address,
        billingRules,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update organization" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
