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

export async function POST(req: NextRequest) {
  await validate();

  try {
    const formData = await req.formData();

    const customerName = formData.get("customerName")?.toString();
    const phoneNumberPrimary = formData.get("phoneNumberPrimary")?.toString();
    const phoneNumberSecondary = formData.get("phoneNumberSecondary")?.toString() || "";
    const organizationId = formData.get("organizationId")?.toString();
    const notes = formData.get("notes")?.toString() || "";
    const rentAmount = parseFloat(formData.get("rentAmount")?.toString() || "0");
    const totalDeposit = parseFloat(formData.get("totalDeposit")?.toString() || "0");
    const returnAmount = parseFloat(formData.get("returnAmount")?.toString() || "0");
    const advancePayment = parseFloat(formData.get("advancePayment")?.toString() || "0");
    const discount = parseFloat(formData.get("discount")?.toString() || "0");
    const discountType = formData.get("discountType")?.toString() || "flat";
    const rentalType = formData.get("rentalType")?.toString() || "";
    const invoiceNumber = parseInt(formData.get("invoiceNumber")?.toString() || "0");
    const advancePaymentMethod = formData.get("advancePaymentMethod")?.toString() || "";
    const productsString = formData.get("products")?.toString() || "[]";

    if (!customerName || !phoneNumberPrimary || !productsString) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const products = JSON.parse(productsString);

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, message: "Products list cannot be empty" }, { status: 400 });
    }

    for (const p of products) {
      const productExists = await prisma.product.findUnique({
        where: { id: p.productId },
      });
      if (!productExists) {
        return NextResponse.json({
          message: `Product not found: ${p.productId}`,
        }, { status: 400 });
      }

      const overlappingLock = await prisma.productLock.findFirst({
        where: {
          productId: p.productId,
          OR: [
            {
              deliveryDate: { lte: new Date(p.returnDate) },
              returnDate: { gte: new Date(p.deliveryDate) },
            },
          ],
        },
      });

      if (overlappingLock) {
        return NextResponse.json({
          message: `Selected Product is already booked for selected dates. Please select another date or product.`,
        }, { status: 400 });
      }
    }

    const booking = await prisma.booking.create({
      data: {
        customerName,
        phoneNumberPrimary,
        phoneNumberSecondary,
        organizationId,
        notes,
        rentAmount,
        totalDeposit,
        returnAmount,
        advancePayment,
        discount,
        discountType,
        rentalType,
        invoiceNumber,
        advancePaymentMethod,
        productLocks: {
          create: products.map((p: any) => ({
            productId: p.productId,
            deliveryDate: new Date(p.deliveryDate),
            returnDate: new Date(p.returnDate),
          })),
        },
      },
      include: {
        productLocks: true,
      },
    });

    return NextResponse.json({ message: "Booking created successfully", data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
