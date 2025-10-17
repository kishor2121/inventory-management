import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  await validate();

  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const bookings = await prisma.booking.findMany({
      include: {
        productLocks: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const filtered = bookings.filter((b) =>
      b.productLocks.some((pl) => {
        const delivery = new Date(pl.deliveryDate);
        return (!from || delivery >= from) && (!to || delivery <= to);
      })
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bookings");

    const headers = [
      "Invoice No.",
      "Booking Date",
      "Customer Name",
      "Mobile No.",
      "Alternate No.",
      "Amount",
      "Deposit",
    ];
    sheet.addRow(headers);

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF99" },
      };
    });

    const rows: any[] = [];
    filtered.forEach((b) => {
      const totalAmount = b.productLocks.reduce(
        (sum, pl) => sum + (pl.product?.price || 0),
        0
      );

      const bookingDate = b.productLocks
        .map((pl) => new Date(pl.deliveryDate))
        .sort((a, b) => a.getTime() - b.getTime())[0];

      rows.push({
        invoiceNumber: b.invoiceNumber || "",
        deliveryDate: bookingDate,
        customerName: b.customerName || "",
        phoneNumberPrimary: b.phoneNumberPrimary || "",
        phoneNumberSecondary: b.phoneNumberSecondary || "",
        amount: totalAmount,
        deposit: b.advancePayment || 0,
      });
    });

    rows.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

    rows.forEach((r) =>
      sheet.addRow([
        r.invoiceNumber,
        r.deliveryDate.toLocaleDateString(),
        r.customerName,
        r.phoneNumberPrimary,
        r.phoneNumberSecondary,
        r.amount,
        r.deposit,
      ])
    );

    sheet.getColumn(6).numFmt = '"₹"#,##0.00';
    sheet.getColumn(7).numFmt = '"₹"#,##0.00';

    sheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });
      column.width = maxLength + 2;
    });

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const formatDate = (d: string | null) => d ?? "all";
    const fileName = `bookings_export_${formatDate(fromDate)}_to_${formatDate(toDate)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
