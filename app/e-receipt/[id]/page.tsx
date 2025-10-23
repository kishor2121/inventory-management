"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import "./viewReceipt.css";

export default function EReceiptPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [organizationInfo, setOrganizationInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [orderRes, orgRes] = await Promise.all([
          fetch(`/api/booking/e-receipt/${id}`),
          fetch("/api/organization/get-organization-info"),
        ]);

        if (!orderRes.ok) {
          if (orderRes.status === 404) {
            setError("Booking not found. Please check the booking ID.");
          } else {
            setError("Something went wrong. Please try again later.");
          }
          setLoading(false);
          return;
        }

        const orderData = await orderRes.json();
        const orgData = await orgRes.json();

        setOrder(orderData.data);
        setOrganizationInfo(orgData.data[0]);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch booking. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ textAlign: "center", marginTop: "50px" }}>{error}</div>;
  if (!order || !organizationInfo)
    return <div style={{ textAlign: "center", marginTop: "50px" }}>No booking data found.</div>;

  const productAmount = order.productLocks.reduce(
    (sum: number, lock: any) => sum + (lock.product?.price || 0),
    0
  );

  const total =
    productAmount +
    (order.additionalCharges || 0) +
    order.securityDeposit -
    order.discount;

  const remainingPayment = total - order.advancePayment;
  const returnAmount = remainingPayment - order.advancePayment;

  return (
    <div className="invoice-wrapper">
      <div className="invoice-card">
        {/* === HEADER === */}
        <div className="invoice-header">
          <div className="org-details">
            <h2>{organizationInfo.organizationName}</h2>
            <p>{organizationInfo.address}</p>
            <p>Email: {organizationInfo.email}</p>
            <p>Phone: {organizationInfo.contactNumber}</p>
          </div>

          <div className="invoice-meta">
            <p>
              <strong>Invoice #:</strong> {order.invoiceNumber}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* === BILLED TO === */}
        <div className="billed-box">
          <p className="billed-title">Billed To</p>
          <p className="billed-name">{order.customerName}</p>
          <p className="billed-contact">
            {order.phoneNumberPrimary} {order.phoneNumberSecondary ? `| ${order.phoneNumberSecondary}` : ""}
          </p>
        </div>

        {/* === PRODUCT TABLE === */}
        <table className="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Del. Date</th>
              <th>Return Date</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.productLocks.map((lock: any, index: number) => (
              <tr key={lock.id}>
                <td>{index + 1}</td>
                <td>{lock.product.name}</td>
                <td>{new Date(lock.deliveryDate).toLocaleDateString("en-GB")}</td>
                <td>{new Date(lock.returnDate).toLocaleDateString("en-GB")}</td>
                <td>Rs.{lock.product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* === PAYMENT SUMMARY === */}
        <div className="payment-summary">
          <div className="left-box">
            <div>
              <span>Adv. Payment:</span>
              <span>Rs.{order.advancePayment}</span>
            </div>
            <div>
              <span>Rem. Payment:</span>
              <span className="red">Rs.{remainingPayment}</span>
            </div>
            {/* === Added Return Amount here === */}
            <div>
              <span>Return Amount:</span>
              <span>Rs.{returnAmount}</span> {/* This is the new calculation */}
            </div>
          </div>

          <div className="right-box">
            <div>
              <span>Amount:</span>
              <span>Rs.{productAmount}</span>
            </div>
            <div>
              <span>Additional Charges:</span>
              <span>Rs.{order.additionalCharges ? order.additionalCharges : 0}</span>
            </div>
            <div>
              <span>Deposit:</span>
              <span>Rs.{order.securityDeposit}</span>
            </div>
            <div>
              <span>Discount:</span>
              <span className="green">- Rs.{order.discount}</span>
            </div>
            <div className="total">
              <strong>Total:</strong>
              <strong>Rs.{total}</strong>
            </div>
          </div>
        </div>

        {/* === FOOTER === */}
        <div className="footer-note">
          <p>Thanks You Visit Again!</p>
        </div>
      </div>
    </div>
  );
}
