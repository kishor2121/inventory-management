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
  week: string; // weekly range e.g., "31 Aug - 06 Sept"
  revenue: number;
  bookings: number;
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
  const [chartData, setChartData] = useState<BookingData[]>([]);
  const [totalData, setTotalData] = useState<TotalData>({
    totalRevenue: 0,
    totalBookingCount: 0,
    revenue: { revenueInCash: 0, revenueInBank: 0 },
  });

  const fetchStats = async (from: string, to: string) => {
    try {
      const res = await fetch(`/api/booking/stats?from=${from}&to=${to}`);
      const data = await res.json();

      const weeklyData: BookingData[] =
        data.weeklyStats?.map((item: any) => ({
          week: item.week,
          revenue: Number(item.revenue),
          bookings: Number(item.bookings),
        })) || [];

      setChartData(weeklyData);

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

    if (filter === "Today") from = to;
    else if (filter === "Last Week") {
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
    } else from = "";

    fetchStats(from, to);
  }, [filter, fromDate, toDate]);

  return (
    <div className="page-container">
      {/* Header */}
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

      {/* Summary Cards */}
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

      {/* Charts */}
      <div className="chart-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>Revenue Overview</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="url(#revGradient)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No revenue data available.</p>
          )}
        </div>

        {/* Booking Chart */}
        <div className="chart-card">
          <h3>Booking Overview</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
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
