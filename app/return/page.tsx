"use client";

import { useState, useEffect } from "react";
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
  advancePaymentMethod: "Cash" | "Bank";
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  size: string[];
}

interface ReturnRecord {
  id: string;
  bookingId: string;
  productId: string;
  deliveryDate: string;
  returnDate: string;
  booking: Booking;
  product: Product;
}

export default function ReturnPage() {
  const [filterType, setFilterType] = useState<string>("Tomorrow");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null); // disable dropdown while updating

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

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

      let url = `/api/booking/list-booking/return?filter=${encodeURIComponent(
        filterValue
      )}`;

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
    item.booking.phoneNumberPrimary.includes(search.trim())
  );

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    if (value !== "Custom Date") {
      setFromDate(null);
      setToDate(null);
    }
  };

  // Handle advancePaymentMethod change using FormData
  const handlePaymentMethodChange = async (
    bookingId: string,
    newMethod: "Cash" | "Bank"
  ) => {
    setUpdatingBookingId(bookingId); // disable dropdown while updating
    try {
      const formData = new FormData();
      formData.append("bookingId", bookingId);
      formData.append("advancePaymentMethod", newMethod);

      const res = await fetch("/api/booking/update-booking", {
        method: "PUT", // must match your backend expecting form-data
        body: formData,
      });

      if (!res.ok) {
        console.error("Failed to update payment method");
        return;
      }

      // Optimistically update local state
      setData((prevData) =>
        prevData.map((item) =>
          item.booking.id === bookingId
            ? { ...item, booking: { ...item.booking, advancePaymentMethod: newMethod } }
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
                <th>Product</th>
                <th>Deposit</th>
                <th>Return Mode</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.booking.customerName}</td>
                    <td>{item.booking.phoneNumberPrimary}</td>
                    <td>{item.booking.phoneNumberSecondary}</td>
                    <td>{item.product.name}</td>
                    <td>₹{item.booking.totalDeposit.toLocaleString()}</td>
                    <td>
                      <select
                        value={item.booking.advancePaymentMethod}
                        disabled={updatingBookingId === item.booking.id} // disable while updating
                        onChange={(e) =>
                          handlePaymentMethodChange(
                            item.booking.id,
                            e.target.value as "Cash" | "Bank"
                          )
                        }
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="no-data">
                    No Data Found
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
