import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  await validate();

  const { id } = await context.params;

  try {
    const productLocks = await prisma.productLock.findMany({
      where: { productId: id },
      select: {
        bookingId: true,
        productId: true,
        deliveryDate: true,
        returnDate: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
          },
        },
      },
    });

    if (productLocks.length === 0) {
      return NextResponse.json(
        { message: "No bookings found for this product" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: productLocks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
