import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  await validate();

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const search = (searchParams.get("search") || "").trim();

    const getDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let productLockWhere: any = {};

    if (filter === "today") {
      const today = getDateOnly(new Date());
      productLockWhere = { deliveryDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } };
    } else if (filter === "tomorrow") {
      const tomorrow = getDateOnly(new Date(Date.now() + 24 * 60 * 60 * 1000));
      productLockWhere = { deliveryDate: { gte: tomorrow, lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) } };
    } else if (filter === "custom") {
      if (!start || !end) {
        return NextResponse.json({ message: "start and end are required for custom export" }, { status: 400 });
      }
      const parseDateOnly = (s: string) => {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
      };

      const startDate = getDateOnly(parseDateOnly(start));
      const endDate = getDateOnly(parseDateOnly(end));
      productLockWhere = { deliveryDate: { gte: startDate, lt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000) } };
    }

    // Build where clause (support optional search by name/phone)
    const bookingWhere: any = { isDeleted: false };

    if (search) {
      bookingWhere.AND = [
        {
          OR: [
            { customerName: { contains: search, mode: "insensitive" } },
            { phoneNumberPrimary: { contains: search } },
            { phoneNumberSecondary: { contains: search } },
          ],
        },
      ];
    }

    if (filter !== "all") {
      bookingWhere.AND = bookingWhere.AND || [];
      bookingWhere.AND.push({ productLocks: { some: productLockWhere } });
    }

    // Fetch bookings and include productLocks (filtered if not 'all')
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        productLocks: filter === "all" ? { include: { product: true } } : { where: productLockWhere, include: { product: true } },
      },
    });

    // Build rows: one row per productLock (so delivery/return are explicit)
    const rows: any[] = [];
    bookings.forEach((b: any) => {
      (b.productLocks || []).forEach((pl: any) => {
        rows.push({
          receivingDate: pl.deliveryDate ? new Date(pl.deliveryDate) : null,
          returnDate: pl.returnDate ? new Date(pl.returnDate) : null,
          customerName: b.customerName || "",
          phoneNumberPrimary: b.phoneNumberPrimary || "",
          phoneNumberSecondary: b.phoneNumberSecondary || "",
          amount: pl.product?.price || 0,
          deposit: b.securityDeposit || 0,
          rent: b.rentAmount || 0,
          refund: b.returnAmount || 0,
          notes: b.notes || "",
          paymentMode: b.deliverypaymnetMethod || "",
          sku: pl.product?.sku || "",
          productName: pl.product?.name || "",
        });
      });
    });

    // Sort by receivingDate descending (latest first)
    rows.sort((a, b) => (b.receivingDate?.getTime() || 0) - (a.receivingDate?.getTime() || 0));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Delivery Report");

    const headers = [
      "Receiving Date",
      "Return Date",
      "Customer Name",
      "Mobile No.",
      "Alternate No.",
      "Amount",
      "Deposit",
      "Rent",
      "Refund",
      "Notes",
      "Payment Mode",
      "SKU",
      "Product Name",
    ];

    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };

    rows.forEach((r) =>
      sheet.addRow([
        r.receivingDate ? r.receivingDate.toLocaleDateString("en-GB") : "",
        r.returnDate ? r.returnDate.toLocaleDateString("en-GB") : "",
        r.customerName,
        r.phoneNumberPrimary,
        r.phoneNumberSecondary,
        r.amount,
        r.deposit,
        r.rent,
        r.refund,
        r.notes,
        r.paymentMode,
        r.sku,
        r.productName,
      ])
    );

    // Format currency columns
    const amountColIdx = 6;
    const depositColIdx = 7;
    const rentColIdx = 8;
    const refundColIdx = 9;
    sheet.getColumn(amountColIdx).numFmt = '"₹"#,##0.00';
    sheet.getColumn(depositColIdx).numFmt = '"₹"#,##0.00';
    sheet.getColumn(rentColIdx).numFmt = '"₹"#,##0.00';
    sheet.getColumn(refundColIdx).numFmt = '"₹"#,##0.00';

    // Auto width
    sheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const formatDate = (d: string | null) => d ?? "all";
    const fileName = `delivery_export_${formatDate(start)}_to_${formatDate(end)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting delivery report:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
