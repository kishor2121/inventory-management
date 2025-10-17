"use client";

import { useState, useEffect } from "react";
import React from "react";
import DatePicker from "react-datepicker";
import { Search } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import "./Delivery.css";

interface Booking {
  id: string;
  customerName: string;
  phoneNumberPrimary: string;
  phoneNumberSecondary: string;
  notes: string;
  securityDeposit: number;
  advancePayment: number;
  discount: number;
  deliverypaymnetMethod: "Cash" | "Bank" | "";
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

interface DeliveryRecord extends Booking {
  productLocks: ProductLock[];
}

export default function DeliveryPage() {
  const [filterType, setFilterType] = useState<string>("Tomorrow");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<DeliveryRecord[]>([]);
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
      let filterValue = filterType.toLowerCase();
      if (filterType === "Custom Date") filterValue = "custom";

      if (filterValue === "custom" && (!fromDate || !toDate)) {
        setLoading(false);
        return;
      }

      let url = `/api/booking/list-booking/delivery?filter=${encodeURIComponent(filterValue)}`;

      if (filterValue === "custom" && fromDate && toDate) {
        url += `&start=${formatDate(fromDate)}&end=${formatDate(toDate)}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.data) setData(json.data);
      else setData([]);
    } catch (error) {
      console.error("Failed to fetch delivery data:", error);
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
      formData.append("deliverypaymnetMethod", newMethod);

      const res = await fetch("/api/booking/update-booking", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        console.error("Failed to update delivery payment method");
        return;
      }

      setData((prevData) =>
        prevData.map((item) =>
          item.id === bookingId
            ? { ...item, deliverypaymnetMethod: newMethod }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating delivery payment method:", error);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2 className="orders-title">Delivery</h2>

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
                <th>Amount</th>
                <th>Deposit</th>
                <th>Rem. Payment</th>
                <th>Rem. Payment Mode</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((booking) => {
                  const isExpanded = expandedRows.includes(booking.id);

                  const totalAmount = booking.productLocks.reduce(
                    (sum, lock) => sum + lock.product.price,
                    0
                  );

                  const deposit = booking.securityDeposit;
                  const remPayment =
                    totalAmount + deposit - booking.discount - booking.advancePayment;

                  return (
                    <React.Fragment key={booking.id}>
                      <tr>
                        <td>{booking.customerName}</td>
                        <td>{booking.phoneNumberPrimary}</td>
                        <td>{booking.phoneNumberSecondary}</td>
                        <td>₹{totalAmount.toLocaleString()}</td>
                        <td>₹{deposit.toLocaleString()}</td>
                        <td>₹{remPayment.toLocaleString()}</td>
                        <td>
                          <select
                            value={booking.deliverypaymnetMethod || "Cash"}
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
                        </td>
                        <td
                          className="arrow-cell"
                          onClick={() => toggleRow(booking.id)}
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
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
                                      <img
                                        src={lock.product.images[0] || "/no_image.jpg"}
                                        alt={lock.product.name}
                                        className="product-image"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "/no_image.jpg";
                                        }}
                                      />
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="no-data">
                    No deliveries found.
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
