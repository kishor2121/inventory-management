import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";

export async function PUT(req: NextRequest) {
  await validate();

  try {
    const formData = await req.formData();

    const bookingId = formData.get("bookingId")?.toString();
    const customerName = formData.get("customerName")?.toString();
    const phoneNumberPrimary = formData.get("phoneNumberPrimary")?.toString();
    const phoneNumberSecondary = formData.get("phoneNumberSecondary")?.toString() || "";
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

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "Missing bookingId" }, { status: 400 });
    }

    const bookingExists = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!bookingExists) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    const products = JSON.parse(productsString);

    await prisma.productLock.deleteMany({ where: { bookingId } });

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        customerName,
        phoneNumberPrimary,
        phoneNumberSecondary,
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
      include: { productLocks: true },
    });

    return NextResponse.json({ success: true, message: "Booking updated successfully", data: updatedBooking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
