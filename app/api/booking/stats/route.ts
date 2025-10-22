import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";

export async function GET(req: NextRequest) {
  await validate();

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { message: "Please provide both 'from' and 'to' dates" },
        { status: 400 }
      );
    }

    const locks = await prisma.productLock.findMany({
      where: {
        deliveryDate: {
          gte: new Date(from),
          lte: new Date(to),
        },
        booking: {
          isDeleted: false,
        },
      },
      include: {
        booking: true,
        product: true, 
      },
    });

    const totalBookingCount = new Set(locks.map(l => l.bookingId)).size;

    const totalRevenue = locks.reduce((sum, l) => sum + (l.product?.price || 0), 0);

    const revenueInCash = locks
      .filter(l => l.booking?.advancePaymentMethod === "Cash")
      .reduce((sum, l) => sum + (l.product?.price || 0), 0);

    const revenueInBank = locks
      .filter(l => l.booking?.advancePaymentMethod === "Card")
      .reduce((sum, l) => sum + (l.product?.price || 0), 0);

    return NextResponse.json({
      total: {
        totalRevenue,
        totalBookingCount,
        revenue: {
          revenueInCash,
          revenueInBank,
        },
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
