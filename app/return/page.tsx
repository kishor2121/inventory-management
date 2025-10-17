"use client";

import { useState, useEffect } from "react";
import React from "react";
import DatePicker from "react-datepicker";
import { Search } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import "./Return.css";

interface Booking {
  id: string;
  customerName: string;
  phoneNumberPrimary: string;
  phoneNumberSecondary: string;
  notes: string;
  rentAmount: number;
  totalDeposit: number;
  returnAmount: number;
  advancePayment: number;
  discount: number;
  discountType: string;
  rentalType: string;
  invoiceNumber: number;
  returnpaymnetMethod: "Cash" | "Bank" | "";
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  images: string[];
  size: string[];
}

interface ProductLock {
  id: string;
  bookingId: string;
  productId: string;
  deliveryDate: string;
  returnDate: string;
  product: Product;
}

interface ReturnRecord extends Booking {
  productLocks: ProductLock[];
}

export default function ReturnPage() {
  const [filterType, setFilterType] = useState<string>("Tomorrow");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const toggleRow = (bookingId: string) => {
    setExpandedRows((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let filterValue = filterType;
      if (filterType === "Custom Date") filterValue = "custom";
      else if (filterType === "Today") filterValue = "today";
      else if (filterType === "Tomorrow") filterValue = "tomorrow";

      if (filterValue === "custom" && (!fromDate || !toDate)) {
        setLoading(false);
        return;
      }

      let url = `/api/booking/list-booking/return?filter=${encodeURIComponent(filterValue)}`;

      if (filterValue === "custom" && fromDate && toDate) {
        url += `&start=${formatDate(fromDate)}&end=${formatDate(toDate)}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.data) setData(json.data);
      else setData([]);
    } catch (error) {
      console.error("Failed to fetch return data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, fromDate, toDate]);

  const filteredData = data.filter((item) =>
    item.phoneNumberPrimary.includes(search.trim())
  );

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    if (value !== "Custom Date") {
      setFromDate(null);
      setToDate(null);
    }
  };

  const handlePaymentMethodChange = async (
    bookingId: string,
    newMethod: "Cash" | "Bank"
  ) => {
    setUpdatingBookingId(bookingId);
    try {
      const formData = new FormData();
      formData.append("bookingId", bookingId);
      formData.append("returnpaymnetMethod", newMethod);

      const res = await fetch("/api/booking/update-booking", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        console.error("Failed to update payment method");
        return;
      }

      setData((prevData) =>
        prevData.map((item) =>
          item.id === bookingId
            ? { ...item, returnpaymnetMethod: newMethod }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating payment method:", error);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2 className="orders-title">Returns</h2>

        <div className="filters">
          <select
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="date-wrapper"
          >
            <option>Today</option>
            <option>Tomorrow</option>
            <option>Custom Date</option>
          </select>

          {filterType === "Custom Date" && (
            <>
              <div className="date-wrapper">
                <DatePicker
                  selected={fromDate}
                  onChange={(date) => setFromDate(date)}
                  placeholderText="From date"
                  className="date-input"
                />
              </div>
              <div className="date-wrapper">
                <DatePicker
                  selected={toDate}
                  onChange={(date) => setToDate(date)}
                  placeholderText="To date"
                  className="date-input"
                />
              </div>
            </>
          )}

          <div className="search-wrapper">
            <Search size={16} className="icon" />
            <input
              type="text"
              placeholder="Search by mobile no"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="no-data">Loading...</div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile No.</th>
                <th>Alternate No.</th>
                <th>Return Amount</th>
                <th>Return Mode</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((booking) => {
                  const returnAmount = Math.max(
                    0,
                    booking.totalDeposit - booking.rentAmount
                  );
                  const isExpanded = expandedRows.includes(booking.id);

                  return (
                    <React.Fragment key={booking.id}>
                      {/* Main Row */}
                      <tr>
                        <td>{booking.customerName}</td>
                        <td>{booking.phoneNumberPrimary}</td>
                        <td>{booking.phoneNumberSecondary}</td>
                        <td>₹{returnAmount.toLocaleString()}</td>
                        <td style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <select
                            value={booking.returnpaymnetMethod || "Cash"}
                            disabled={updatingBookingId === booking.id}
                            onChange={(e) =>
                              handlePaymentMethodChange(
                                booking.id,
                                e.target.value as "Cash" | "Bank"
                              )
                            }
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank</option>
                          </select>

                          <span
                            onClick={() => toggleRow(booking.id)}
                            style={{
                              cursor: "pointer",
                              fontSize: "14px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Table Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ background: "#f9fafb" }}>
                            <table className="product-details-table">
                              <thead>
                                <tr>
                                  <th>Image</th>
                                  <th>SKU</th>
                                  <th>Product Name</th>
                                  <th>Delivery Date</th>
                                  <th>Return Date</th>
                                  <th>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {booking.productLocks.map((lock) => (
                                  <tr key={lock.id}>
                                    <td>
                                      {lock.product.images.length > 0 ? (
                                        <img
                                          src={lock.product.images[0]}
                                          alt={lock.product.name}
                                          style={{
                                            width: "60px",
                                            height: "60px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                          }}
                                        />
                                      ) : (
                                        <span>No image</span>
                                      )}
                                    </td>
                                    <td>{lock.product.sku}</td>
                                    <td>{lock.product.name}</td>
                                    <td>{new Date(lock.deliveryDate).toLocaleDateString()}</td>
                                    <td>{new Date(lock.returnDate).toLocaleDateString()}</td>
                                    <td>₹{lock.product.price.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {/* Notes row (optional, remove if not needed) */}
                            {booking.notes && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  padding: "8px",
                                  background: "#fff7ed",
                                  color: "#afa199ff",
                                  fontStyle: "italic",
                                  borderRadius: "4px",
                                }}
                              >
                                <strong>Notes:</strong> {booking.notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
