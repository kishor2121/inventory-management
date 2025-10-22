import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMon = (day + 6) % 7; // Mon = 0
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", options);
  return `${startStr} - ${endStr}`;
}

export async function GET(req: NextRequest) {
  await validate();
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ message: "Please provide 'from' and 'to' dates" }, { status: 400 });
    }

    const locks = await prisma.productLock.findMany({
      where: {
        deliveryDate: { gte: new Date(from), lte: new Date(to) },
        booking: { isDeleted: false },
      },
      include: { booking: true, product: true },
    });

    const weeklyMap: Record<string, { revenue: number; bookings: Set<string> }> = {};

    locks.forEach((l) => {
      if (!l.deliveryDate) return;
      const weekRange = getWeekRange(l.deliveryDate);
      if (!weeklyMap[weekRange]) weeklyMap[weekRange] = { revenue: 0, bookings: new Set() };
      weeklyMap[weekRange].revenue += l.product?.price || 0;
      weeklyMap[weekRange].bookings.add(l.bookingId);
    });

    const weeklyStats = Object.entries(weeklyMap)
      .sort(([a], [b]) => new Date(a.split(" - ")[0]).getTime() - new Date(b.split(" - ")[0]).getTime())
      .map(([week, data]) => ({
        week,
        revenue: data.revenue,
        bookings: data.bookings.size,
      }));

    const totalBookingCount = new Set(locks.map((l) => l.bookingId)).size;
    const totalRevenue = locks.reduce((sum, l) => sum + (l.product?.price || 0), 0);
    const revenueInCash = locks.filter((l) => l.booking?.advancePaymentMethod === "Cash").reduce((sum, l) => sum + (l.product?.price || 0), 0);
    const revenueInBank = locks.filter((l) => l.booking?.advancePaymentMethod === "Card").reduce((sum, l) => sum + (l.product?.price || 0), 0);

    return NextResponse.json({ weeklyStats, total: { totalRevenue, totalBookingCount, revenue: { revenueInCash, revenueInBank } } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
