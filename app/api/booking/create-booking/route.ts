import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";

function generateBookingId(customerName: string) {
  const prefix = "bk"; 
  const last4 = customerName.slice(-4).toLowerCase().padStart(4, "x");
  const randomNum = Math.floor(1000 + Math.random() * 9000); 
  return `${prefix}${last4}${randomNum}`;
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
    const securityDeposit = parseFloat(formData.get("securityDeposit")?.toString() || "0");
    const returnAmount = parseFloat(formData.get("returnAmount")?.toString() || "0");
    const advancePayment = parseFloat(formData.get("advancePayment")?.toString() || "0");
    const discount = parseFloat(formData.get("discount")?.toString() || "0");
    const discountType = formData.get("discountType")?.toString() || "flat";
    const rentalType = formData.get("rentalType")?.toString() || "";
    const advancePaymentMethod = formData.get("advancePaymentMethod")?.toString() || "";
    const productsString = formData.get("products")?.toString() || "[]";

    if (!customerName || !phoneNumberPrimary || !productsString) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const products = JSON.parse(productsString);

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, message: "Products list cannot be empty" }, { status: 400 });
    }

    const overlappingProducts: string[] = [];

    for (const p of products) {
      const productExists = await prisma.product.findUnique({
        where: { id: p.productId },
      });

      if (!productExists) {
        return NextResponse.json({
          message: `Product not found: ${p.productId}`,
        }, { status: 400 });
      }

      if (productExists.status !== "available") {
        return NextResponse.json({
          message: `Product is currently ${productExists.status}. Please wait until it becomes available.`,
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
        overlappingProducts.push(productExists.name); 
      }
    }

    if (overlappingProducts.length > 0) {
      return NextResponse.json({
        message: `The following product are already booked. Please select another date: ${overlappingProducts.join(", ")}`,
      }, { status: 400 });
    }

    const lastBooking = await prisma.booking.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const invoiceNumber = lastBooking ? lastBooking.invoiceNumber + 1 : 1;

    const bookingId = generateBookingId(customerName);

    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        customerName,
        phoneNumberPrimary,
        phoneNumberSecondary,
        organizationId,
        notes,
        rentAmount,
        totalDeposit,
        securityDeposit,
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
