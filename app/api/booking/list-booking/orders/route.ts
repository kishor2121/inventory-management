import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../../auth/validate";

export async function GET(req: NextRequest) {
  await validate();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const skip = (page - 1) * perPage;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: perPage,
        include: { productLocks: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count(),
    ]);

    return NextResponse.json({
      data: bookings
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
