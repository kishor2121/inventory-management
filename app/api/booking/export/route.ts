import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import validate from "../../auth/validate";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";

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
        productLocks: {
          include: { product: true },
        },
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

    const rows = [];
    filtered.forEach((b) => {
      b.productLocks.forEach((pl) => {
        rows.push({
          invoiceNumber: b.invoiceNumber || "",
          deliveryDate: new Date(pl.deliveryDate),
          customerName: b.customerName || "",
          phoneNumberPrimary: b.phoneNumberPrimary || "",
          phoneNumberSecondary: b.phoneNumberSecondary || "",
          amount: pl.product?.price || 0,
          deposit: b.advancePayment || 0,
        });
      });
    });

    rows.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

    rows.forEach((row) => {
      sheet.addRow([
        row.invoiceNumber,
        row.deliveryDate.toLocaleDateString(),
        row.customerName,
        row.phoneNumberPrimary,
        row.phoneNumberSecondary,
        row.amount,
        row.deposit,
      ]);
    });

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

    const formatDateForFile = (dateStr: string | null) => {
      if (!dateStr) return "all";
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "all" : d.toISOString().split("T")[0];
    };

    const cleanFrom = formatDateForFile(fromDate);
    const cleanTo = formatDateForFile(toDate);

    const fileName = `bookings_export_${cleanFrom}_to_${cleanTo}.xlsx`;
    const exportDir = path.join(process.cwd(), "public", "exports");

    await fs.mkdir(exportDir, { recursive: true });

    await fs.writeFile(path.join(exportDir, fileName), buffer);

    const baseUrl = new URL(req.url).origin;
    const fileUrl = `${baseUrl}/exports/${fileName}`;

    return NextResponse.json({
      message: "File generated successfully",
      downloadUrl: fileUrl,
    });
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
