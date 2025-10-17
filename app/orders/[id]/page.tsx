"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer, Copy, Download, MessageCircle } from "lucide-react";
import "./viewOrder.css";

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

export default function ViewOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/booking/${id}`);
        const data = await res.json();
        if (data?.data) {
          setOrder(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      }
    }
    fetchOrder();
  }, [id]);

  if (!order) return <div>Loading...</div>;

  // Product amount
  const productAmount = order.productLocks.reduce(
    (sum, lock) => sum + (lock.product?.price || 0),
    0
  );

  // Security deposit
  const securityDeposit = order.securityDeposit;

  // Discount
  const discount = order.discount;

  // Total = productAmount + securityDeposit - discount
  const total = productAmount + securityDeposit - discount;

  // Remaining payment = total - advancePayment
  const remainingPayment = total - order.advancePayment;

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
          <button className="download"><Download size={16} /> Download</button>
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
