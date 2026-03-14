import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    const { productLockId, isReceived } = await req.json();

    if (!productLockId) {
      return NextResponse.json({ error: "ProductLock ID is required" }, { status: 400 });
    }

    // Update the isReceived field
    const updatedLock = await prisma.productLock.update({
      where: { id: productLockId },
      data: { isReceived },
    });

    return NextResponse.json({ success: true, data: updatedLock });
  } catch (error) {
    console.error("Error updating product lock:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}