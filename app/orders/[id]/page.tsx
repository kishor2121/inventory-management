"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer, Copy, Download, MessageCircle } from "lucide-react";
import "./viewOrder.css";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ProductLock {
  id: string;
  deliveryDate: string;
  returnDate: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    size: string[];
  };
}

interface OrderDetails {
  id: string;
  customerName: string;
  phoneNumberPrimary: string;
  phoneNumberSecondary: string;
  notes?: string;
  rentAmount: number;
  securityDeposit: number;
  returnAmount: number;
  advancePayment: number;
  discount: number;
  discountType: string;
  invoiceNumber: number;
  createdAt: string;
  productLocks: ProductLock[];
}

interface OrganizationInfo {
  organizationName: string;
  address: string;
  contactNumber: string;
  email: string;
}

export default function ViewOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null);

  useEffect(() => {
    async function fetchOrderAndOrganizationInfo() {
      try {
        const resOrder = await fetch(`/api/booking/${id}`);
        const dataOrder = await resOrder.json();
        if (dataOrder?.data) setOrder(dataOrder.data);

        const resOrganization = await fetch("/api/organization/get-organization-info");
        const dataOrganization = await resOrganization.json();
        setOrganizationInfo(dataOrganization.data[0]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
    fetchOrderAndOrganizationInfo();
  }, [id]);

  if (!order || !organizationInfo) return <div>Loading...</div>;

  const productAmount = order.productLocks.reduce(
    (sum, lock) => sum + (lock.product?.price || 0),
    0
  );
  const securityDeposit = order.securityDeposit;
  const discount = order.discount;
  const total = productAmount + securityDeposit - discount;
  const remainingPayment = total - order.advancePayment;

   // ✅ Shared PDF Generator
// ✅ Updated PDF Generator (UI matches image exactly, uses Rs.)
const generatePDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 20;

  const formatCurrency = (amount: number) =>
    `Rs.${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  // === 1. Header ===
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(0);
  doc.text(organizationInfo.organizationName, margin, currentY);

  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100);
  doc.text(organizationInfo.address, margin, currentY + 6);
  doc.text(`Email: ${organizationInfo.email}`, margin, currentY + 12);
  doc.text(`Phone: ${organizationInfo.contactNumber}`, margin, currentY + 18);

  // Invoice info (top-right)
  doc.setTextColor(0).setFontSize(12);
  const invoiceY = currentY;
  doc.text(`Invoice #: ${order.invoiceNumber}`, pageWidth - margin, invoiceY, { align: "right" });
  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`,
    pageWidth - margin,
    invoiceY + 6,
    { align: "right" }
  );

  currentY += 28;

  // === 2. Billed To Box ===
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 3, 3, "F");
  doc.setTextColor(0).setFont("helvetica", "bold").setFontSize(11);
  doc.text("Billed To", margin + 5, currentY + 6);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(order.customerName, margin + 5, currentY + 12);
  doc.text(`${order.phoneNumberPrimary} | ${order.phoneNumberSecondary}`, margin + 5, currentY + 18);
  currentY += 30;

  // === 3. Product Table ===
  autoTable(doc, {
    startY: currentY,
    head: [["#", "Product Name", "Del. Date", "Return Date", "Amount"]],
    body: order.productLocks.map((lock, i) => [
      i + 1,
      lock.product.name,
      new Date(lock.deliveryDate).toLocaleDateString("en-GB"),
      new Date(lock.returnDate).toLocaleDateString("en-GB"),
      formatCurrency(lock.product.price),
    ]),
    theme: "grid",
    styles: { lineColor: [200, 200, 200], lineWidth: 0.2, fontSize: 10, cellPadding: 3 },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: { textColor: 0, halign: "center" },
    columnStyles: { 1: { halign: "left" }, 4: { halign: "right" } },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // === 4. Payment Summary (two-column boxes) ===
  const leftX = margin;
  const rightX = pageWidth / 2 + 10;
  let leftY = currentY;
  let rightY = currentY;

  // Left Box (Advance + Remaining)
  doc.roundedRect(leftX, leftY, 75, 24, 2, 2);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text("Adv. Payment:", leftX + 3, leftY + 8);
  doc.text(formatCurrency(order.advancePayment), leftX + 70, leftY + 8, { align: "right" });

  doc.setTextColor(220, 38, 38);
  doc.text("Rem. Payment:", leftX + 3, leftY + 16);
  doc.text(formatCurrency(total - order.advancePayment), leftX + 70, leftY + 16, { align: "right" });
  doc.setTextColor(0);

  // Right Box (Amount + Deposit + Discount + Total)
  doc.roundedRect(rightX, rightY, 80, 32, 2, 2);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text("Amount:", rightX + 3, rightY + 8);
  doc.text(formatCurrency(productAmount), rightX + 75, rightY + 8, { align: "right" });

  doc.text("Deposit:", rightX + 3, rightY + 16);
  doc.text(formatCurrency(order.securityDeposit), rightX + 75, rightY + 16, { align: "right" });

  doc.text("Discount:", rightX + 3, rightY + 22);
  doc.setTextColor(34, 197, 94);
  doc.text(`- ${formatCurrency(order.discount)}`, rightX + 75, rightY + 22, { align: "right" });
  doc.setTextColor(0);

  doc.line(rightX + 3, rightY + 26, rightX + 77, rightY + 26);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", rightX + 3, rightY + 31);
  doc.text(formatCurrency(total), rightX + 75, rightY + 31, { align: "right" });
  
  // === 5. Notes Section ===
    currentY = Math.max(leftY + 30, rightY + 40);
    if (order.notes) {
      doc.setFont("helvetica", "bold").setFontSize(11);
      doc.text("Special Note:", margin, currentY);
      doc.setFont("helvetica", "normal").setFontSize(10);
      const noteText = doc.splitTextToSize(order.notes, pageWidth - margin * 2 - 25);
      doc.text(noteText, margin + 30, currentY); // indent note text after label
    }


  // === 6. Footer ===
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
  doc.setFont("helvetica", "italic").setFontSize(10).setTextColor(120);
  doc.text("Thanks You Visit Again!", pageWidth / 2, footerY, { align: "center" });

  return doc;
};

  // ✅ Download PDF
  const handleDownload = () => {
    const doc = generatePDF();
    doc.save(`invoice_${order.invoiceNumber}.pdf`);
  };

  // ✅ Print PDF in new tab
  const handlePrint = () => {
    const doc = generatePDF();
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  };

  // ✅ whatsappweb
  const handleWhatsappShare = () => {
    if (!order) return;

    const phoneNumber = order.phoneNumberPrimary.startsWith("+")
      ? order.phoneNumberPrimary.slice(1)
      : order.phoneNumberPrimary;

    const baseUrl = window.location.origin;
    const receiptLink = `${baseUrl}/e-receipt/${order.id}`;

    const message = `👉 *Invoice #${order.invoiceNumber} is Ready!*\n\nHello *${order.customerName}*,\n\nThank you for choosing our service.\n\n *View/Download Invoice:*\n${receiptLink}\n\nIf you have any questions, feel free to contact us.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="view-order-container">
      <div className="view-header">
        <button className="back-btn" onClick={() => router.push("/orders")}>
          <ArrowLeft size={18} /> Orders
        </button>
        <div className="action-buttons">
          <button className="whatsapp" onClick={handleWhatsappShare}>
            <MessageCircle size={16} /> Share on Whatsapp
          </button>
          <button className="copy"><Copy size={16} /> Copy</button>
          <button className="print" onClick={handlePrint}>
            <Printer size={16} /> Print Invoice
          </button>
          <button className="download" onClick={handleDownload}>
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      {/* Display invoice */}
      <div className="invoice-card">
        <div className="invoice-header">
          <h4>Invoice # {order.invoiceNumber}</h4>
          <span className="date">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="customer-details">
          <p className="name">{order.customerName}</p>
          <p>{order.phoneNumberPrimary} | {order.phoneNumberSecondary}</p>
        </div>

        <table className="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Delivery Date</th>
              <th>Return Date</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.productLocks.map((lock, index) => (
              <tr key={lock.id}>
                <td>{index + 1}</td>
                <td>{lock.product.name}</td>
                <td>{new Date(lock.deliveryDate).toLocaleDateString("en-GB")}</td>
                <td>{new Date(lock.returnDate).toLocaleDateString("en-GB")}</td>
                <td>₹{lock.product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer-section">
          <div className="notes">
            <strong>Notes:</strong> {order.notes || "N/A"}
          </div>

          <div className="payment-summary">
            <div className="payment-box">
              <div>
                <span>Adv. Payment:</span>
                <span className="amount">₹{order.advancePayment}</span>
              </div>
              <div>
                <span>Rem. Payment:</span>
                <span className="remaining">₹{remainingPayment}</span>
              </div>
            </div>

            <div className="totals">
              <div>
                <span>Amount:</span>
                <span>₹{productAmount}</span>
              </div>
              <div>
                <span>Deposit:</span>
                <span>₹{securityDeposit}</span>
              </div>
              <div>
                <span>Discount:</span>
                <span className="discount">-₹{discount}</span>
              </div>
              <div className="total">
                <span>Total:</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
