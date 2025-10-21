import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";

export async function GET(req: NextRequest) {
  await validate();

  try {
    const { searchParams } = new URL(req.url);

    const deliveryDateFilter = searchParams.get("deliveryDate"); 
    const deliveryStart = searchParams.get("deliveryStart"); 
    const deliveryEnd = searchParams.get("deliveryEnd");     

    const returnDateFilter = searchParams.get("returnDate"); 
    const returnStart = searchParams.get("returnStart");    
    const returnEnd = searchParams.get("returnEnd");        

    const whereClause: any = {};

    const getDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = getDateOnly(new Date());
    const tomorrow = getDateOnly(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const productLockFilter: any = {};

    if (deliveryDateFilter) {
      if (deliveryDateFilter === "today") {
        productLockFilter.deliveryDate = { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      } else if (deliveryDateFilter === "tomorrow") {
        productLockFilter.deliveryDate = { gte: tomorrow, lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) };
      } else if (deliveryDateFilter === "custom" && deliveryStart && deliveryEnd) {
        productLockFilter.deliveryDate = { gte: new Date(deliveryStart), lte: new Date(deliveryEnd) };
      }
    }

    if (returnDateFilter) {
      if (returnDateFilter === "today") {
        productLockFilter.returnDate = { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      } else if (returnDateFilter === "tomorrow") {
        productLockFilter.returnDate = { gte: tomorrow, lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) };
      } else if (returnDateFilter === "custom" && returnStart && returnEnd) {
        productLockFilter.returnDate = { gte: new Date(returnStart), lte: new Date(returnEnd) };
      }
    }

    if (Object.keys(productLockFilter).length > 0) {
      whereClause.productLocks = { some: productLockFilter };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        productLocks: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}