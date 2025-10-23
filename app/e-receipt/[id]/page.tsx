"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import "./viewReceipt.css";

export default function EReceiptPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/booking/e-receipt/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Booking not found. Please check the booking ID.");
          } else {
            setError("Something went wrong. Please try again later.");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrder(data.data);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch booking. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ textAlign: "center", marginTop: "50px" }}>{error}</div>;
  if (!order) return <div style={{ textAlign: "center", marginTop: "50px" }}>No booking data found.</div>;

  return (
    <div className="invoice-card">
      <h4>Invoice # {order.invoiceNumber}</h4>
      <p>{order.customerName}</p>
      <p>
        {order.phoneNumberPrimary} | {order.phoneNumberSecondary}
      </p>

      <table className="product-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Delivery</th>
            <th>Return</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.productLocks.map((lock: any, i: number) => (
            <tr key={lock.id}>
              <td>{i + 1}</td>
              <td>{lock.product.name}</td>
              <td>{new Date(lock.deliveryDate).toLocaleDateString("en-GB")}</td>
              <td>{new Date(lock.returnDate).toLocaleDateString("en-GB")}</td>
              <td>₹{lock.product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="footer-section">
        <p>Advance Paid: ₹{order.advancePayment}</p>
        <p>Deposit: ₹{order.securityDeposit}</p>
        <p>Discount: ₹{order.discount}</p>
        <p>
          Total: ₹
          {order.productLocks.reduce(
            (sum: number, lock: any) => sum + lock.product.price,
            0
          ) +
            order.securityDeposit -
            order.discount}
        </p>
        <p>Notes: {order.notes || "N/A"}</p>
      </div>
    </div>
  );
}
