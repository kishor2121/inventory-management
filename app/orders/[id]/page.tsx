"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer, Copy, Download, MessageCircle } from "lucide-react";
import "./viewOrder.css";

// ✅ PDF libraries
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
        if (dataOrder?.data) {
          setOrder(dataOrder.data);
        }

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

  // Calculations
  const productAmount = order.productLocks.reduce(
    (sum, lock) => sum + (lock.product?.price || 0),
    0
  );
  const securityDeposit = order.securityDeposit;
  const discount = order.discount;
  const total = productAmount + securityDeposit - discount;
  const remainingPayment = total - order.advancePayment;

  // ✅ PDF DOWNLOAD - UPDATED WITH FORMATTING AND LAYOUT
  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header - Organization Info Left, Invoice + Date Right
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(organizationInfo.organizationName, 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const orgLines = [
      organizationInfo.email,
      `📞 ${organizationInfo.contactNumber}`,
      organizationInfo.address,
    ];
    let cursorY = 26;
    orgLines.forEach(line => {
      doc.text(line, 14, cursorY);
      cursorY += 6;
    });

    // Invoice info (right side)
    const rightX = pageWidth - 60;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #${order.invoiceNumber}`, rightX, 20);
    doc.text(`Date`, rightX, 26);
    doc.text(new Date(order.createdAt).toLocaleDateString("en-GB"), rightX, 32);

    // Billed To section
    let startY = cursorY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Billed To", 14, startY);
    doc.setFont("helvetica", "bold");
    doc.text(order.customerName, 14, startY + 7);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.phoneNumberPrimary} | ${order.phoneNumberSecondary}`, 14, startY + 14);

    // Table of products
    autoTable(doc, {
      startY: startY + 25,
      head: [["#", "Product Name", "Del. Date", "Return Date", "Amount"]],
      body: order.productLocks.map((lock, index) => [
        index + 1,
        lock.product.name,
        new Date(lock.deliveryDate).toLocaleDateString("en-GB"),
        new Date(lock.returnDate).toLocaleDateString("en-GB"),
        `₹${lock.product.price.toLocaleString()}`,
      ]),
      theme: "grid",
      styles: { fontSize: 11 },
      headStyles: { fillColor: [230, 230, 230], halign: "center" },
      bodyStyles: { halign: "center" },
      columnStyles: {
        1: { halign: "left" },
        4: { halign: "right" },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY + 25 + 50;

    // Payment summary boxes side by side
    const boxWidth = (pageWidth - 42) / 2;
    const boxHeight = 40;
    const boxY = finalY + 10;

    // Left box - Advance and Remaining Payment
    doc.setDrawColor(180);
    doc.rect(14, boxY, boxWidth, boxHeight);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("Adv. Payment:", 18, boxY + 12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 0, 0);
    doc.text(`₹${order.advancePayment.toLocaleString()}`, 18 + 45, boxY + 12);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 0, 0);
    doc.text("Rem. Payment:", 18, boxY + 26);
    doc.setFont("helvetica", "bold");
    doc.text(`₹${remainingPayment.toLocaleString()}`, 18 + 45, boxY + 26);

    // Right box - Amount, Deposit, Discount, Total
    doc.setDrawColor(180);
    doc.rect(14 + boxWidth + 14, boxY, boxWidth, boxHeight);

    const rightBoxX = 14 + boxWidth + 14;
    const labelX = rightBoxX + boxWidth - 55;
    let labelY = boxY + 12;

    const paymentLines = [
      { label: "Amount:", value: productAmount, color: "black", bold: false },
      { label: "Deposit:", value: securityDeposit, color: "black", bold: false },
      { label: "Discount:", value: discount, color: "green", bold: false },
      { label: "Total:", value: total, color: "black", bold: true },
    ];

    paymentLines.forEach(({ label, value, color, bold }) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(label, labelX, labelY);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(color === "green" ? "green" : "black");
      doc.text(`₹${value.toLocaleString()}`, labelX + 45, labelY);
      labelY += 14;
    });

    // Special Notes (if any)
    if (order.notes) {
      const notesY = boxY + boxHeight + 15;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Special Notes", 14, notesY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");

      // Wrap long notes
      const splitNotes = doc.splitTextToSize(order.notes, pageWidth - 28);
      splitNotes.forEach((line, idx) => {
        doc.text(`• ${line}`, 18, notesY + 8 + idx * 7);
      });
    }

    // Footer - centered at bottom
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const footerText = "Thanks You Visit Again!";
    const footerX = pageWidth / 2 - doc.getTextWidth(footerText) / 2;
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.text(footerText, footerX, footerY);

    doc.save(`invoice_${order.invoiceNumber}.pdf`);
  };

  return (
    <div className="view-order-container">
      <div className="view-header">
        <button className="back-btn" onClick={() => router.push("/orders")}>
          <ArrowLeft size={18} /> Orders
        </button>
        <div className="action-buttons">
          <button className="whatsapp">
            <MessageCircle size={16} /> Share on Whatsapp
          </button>
          <button className="copy"><Copy size={16} /> Copy</button>
          <button className="print"><Printer size={16} /> Print Invoice</button>
          <button className="download" onClick={handleDownload}>
            <Download size={16} /> Download
          </button>
        </div>
      </div>

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
