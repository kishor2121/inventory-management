"use client";

import { useState, useEffect } from "react";
import { Eye, Edit, Trash2, Search, Calendar, X } from "lucide-react";
import { useRouter } from "next/navigation";
import "./orders.css";

interface ProductLock {
  id: string;
  productId: string;
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

interface Order {
  id: string;
  customerName: string;
  phoneNumberPrimary: string;
  phoneNumberSecondary: string;
  rentAmount: number;
  totalDeposit: number;
  returnAmount: number;
  invoiceNumber: number;
  createdAt: string;
  productLocks: ProductLock[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/booking/list-booking/orders");
      const data = await res.json();
      if (data?.data) {
        setOrders(data.data);
        setFilteredOrders(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }

  useEffect(() => {
    let result = orders.filter(
      (o) =>
        o.phoneNumberPrimary.toLowerCase().includes(search.toLowerCase()) ||
        o.phoneNumberSecondary.toLowerCase().includes(search.toLowerCase())
    );

    if (fromDate)
      result = result.filter(
        (o) => new Date(o.createdAt) >= new Date(fromDate)
      );
    if (toDate)
      result = result.filter((o) => new Date(o.createdAt) <= new Date(toDate));

    setFilteredOrders(result);
  }, [search, fromDate, toDate, orders]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/booking/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete order");
      await fetchOrders(); 
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2 className="orders-title">Orders</h2>

        <div className="filters">
          <div className="search-wrapper">
            <Search className="icon" size={16} />
            <input
              type="text"
              placeholder="Search by mobile no"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-box"
            />
          </div>

          <div className="date-wrapper">
            <Calendar className="icon" size={16} />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="date-wrapper">
            <Calendar className="icon" size={16} />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Booking Date</th>
              <th>Customer Name</th>
              <th>Mobile No.</th>
              <th>Alternate No.</th>
              <th>Amount</th>
              <th>Deposit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.invoiceNumber}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString("en-GB")}</td>
                  <td>{o.customerName}</td>
                  <td>{o.phoneNumberPrimary}</td>
                  <td>{o.phoneNumberSecondary}</td>
                  <td>₹{o.rentAmount}</td>
                  <td>₹{o.totalDeposit}</td>
                  <td className="actions">
                    <Eye
                      className="action-icon view"
                      size={16}
                      title="View"
                      onClick={() => router.push(`/orders/${o.id}`)}
                    />
                    <Edit
                      className="action-icon edit"
                      size={16}
                      title="Edit"
                      onClick={() => router.push(`/create-booking/${o.id}/updatebooking`)}
                    />

                                                          

                    <Trash2
                      className="action-icon delete"
                      size={16}
                      title="Delete"
                      onClick={() => setDeleteId(o.id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-data">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Confirm Order Deletion?</h3>
              <X
                size={18}
                className="close-icon"
                onClick={() => setDeleteId(null)}
              />
            </div>
            <p>Are you sure you want to delete this order?</p>
            <p className="note">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setDeleteId(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
