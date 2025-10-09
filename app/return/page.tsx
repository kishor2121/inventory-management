// app/return/page.tsx
"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Return.css";

interface Product {
  id: number;
  name: string;
  price: number;
  // Add more fields if needed
}

export default function ReturnPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filterType, setFilterType] = useState("Today");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [search, setSearch] = useState("");

  // Fetch products from API
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="Return-page">
      <h2>Return</h2>

      {/* FILTERS */}
      <div className="filters">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option>Today</option>
          <option>Tomorrow</option>
          <option>Custom Date</option>
        </select>

        {filterType === "Custom Date" && (
          <>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              placeholderText="From date"
              className="date-input"
            />
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              placeholderText="To date"
              className="date-input"
            />
          </>
        )}

        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="Return-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              {/* Add more headers if needed */}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>₹{product.price.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="no-data">
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
