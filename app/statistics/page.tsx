"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import "./statistics.css";

interface BookingData {
  week: string;
  revenue: number;
  bookings: number;
  date: string; // ISO string
}

interface TotalData {
  totalRevenue: number;
  totalBookingCount: number;
  revenue: {
    revenueInCash: number;
    revenueInBank: number;
  };
}

export default function Statistics() {
  const [filter, setFilter] = useState<string>("Last Month");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [filteredData, setFilteredData] = useState<BookingData[]>([]);
  const [totalData, setTotalData] = useState<TotalData>({
    totalRevenue: 0,
    totalBookingCount: 0,
    revenue: { revenueInCash: 0, revenueInBank: 0 },
  });

  const fetchStats = async (from: string, to: string) => {
    try {
      const res = await fetch(`/api/booking/stats?from=${from}&to=${to}`);
      const data = await res.json();

      const chartData: BookingData[] =
        data.weeklyStats?.map((item: any) => ({
          week: item.week,
          revenue: Number(item.revenue),
          bookings: Number(item.bookings),
          date: item.date,
        })) || [
          {
            week: "Total",
            revenue: data.total?.totalRevenue || 0,
            bookings: data.total?.totalBookingCount || 0,
            date: new Date().toISOString(),
          },
        ];

      setFilteredData(chartData);

      if (data.total) {
        setTotalData({
          totalRevenue: data.total.totalRevenue,
          totalBookingCount: data.total.totalBookingCount,
          revenue: {
            revenueInCash: data.total.revenue.revenueInCash,
            revenueInBank: data.total.revenue.revenueInBank,
          },
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    const today = new Date();
    let from: string;
    let to: string = today.toISOString().split("T")[0];

    if (filter === "Today") {
      from = to;
    } else if (filter === "Last Week") {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      from = weekAgo.toISOString().split("T")[0];
    } else if (filter === "Last Month") {
      const monthAgo = new Date();
      monthAgo.setDate(today.getDate() - 30);
      from = monthAgo.toISOString().split("T")[0];
    } else if (filter === "Custom Date" && fromDate && toDate) {
      from = fromDate;
      to = toDate;
    } else {
      from = "";
    }

    fetchStats(from, to);
  }, [filter, fromDate, toDate]);

  return (
    <div className="page-container">
      <div className="header-bar">
        <h2 className="page-title">Statistics</h2>
        <div className="filter-bar">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>Today</option>
            <option>Last Week</option>
            <option>Last Month</option>
            <option>Custom Date</option>
          </select>
          {filter === "Custom Date" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Booking</h3>
          <p>{totalData.totalBookingCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>{totalData.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Revenue In Cash</h3>
          <p>{totalData.revenue.revenueInCash.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Revenue In Bank</h3>
          <p>{totalData.revenue.revenueInBank.toFixed(2)}</p>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Revenue Overview</h3>
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#000000"
                  fill="url(#revGradient)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#000", stroke: "#000" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No revenue data available.</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Booking Overview</h3>
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={filteredData}>
                <defs>
                  <linearGradient id="bookGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="0 0" vertical={false} />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#000", stroke: "#000" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No booking data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
