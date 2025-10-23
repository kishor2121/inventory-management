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
  securityDeposit: number;
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
      const to = toDate ? new Date(toDate + "T23:59:59") : null;

      result = result.filter((o) => {
        const created = new Date(o.createdAt);
        if (from && created < from) return false;
        if (to && created > to) return false;
        return true;
      });
    }

    setFilteredOrders(result);
    setCurrentPage(1); // Reset pagination on filter change
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

  async function handleExport() {
    try {
      const url = `/api/booking/export?from_date=${fromDate || ""}&to_date=${toDate || ""}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to fetch file");
        alert("Failed to export file");
        return;
      }

      let fileName = "bookings.xlsx";
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition && contentDisposition.includes("filename=")) {
        fileName = contentDisposition.split("filename=")[1].replace(/"/g, "");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Export failed. Check console for details.");
    }
  }


  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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

          <button className="export-btn" onClick={handleExport}>
            Export
          </button>
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
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((o) => {
                const productAmount = o.productLocks.reduce(
                  (sum, lock) => sum + lock.product.price,
                  0
                );

                return (
                  <tr key={o.id}>
                    <td>{o.invoiceNumber}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString("en-GB")}</td>
                    <td>{o.customerName}</td>
                    <td>{o.phoneNumberPrimary}</td>
                    <td>{o.phoneNumberSecondary}</td>
                    <td>₹{productAmount}</td>
                    <td>₹{o.securityDeposit}</td>
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
                        onClick={() =>
                          router.push(`/create-booking/${o.id}/updatebooking`)
                        }
                      />
                      <Trash2
                        className="action-icon delete"
                        size={16}
                        title="Delete"
                        onClick={() => setDeleteId(o.id)}
                      />
                    </td>
                  </tr>
                );
              })
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

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? "active-page" : ""}
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Confirm Order Deletion?</h3>
              <X size={18} className="close-icon" onClick={() => setDeleteId(null)} />
            </div>
            <p>Are you sure you want to delete this order?</p>
            <p className="note">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteId(null)} disabled={loading}>
                Cancel
              </button>
              <button className="delete-btn" onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
