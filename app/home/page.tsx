"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { useRouter } from "next/navigation";
import "./home.css";


export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [products, setProducts] = useState<{ value: string; label: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  useEffect(() => {
    const today = new Date();
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    setMounted(true);
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();

        const formatted = json.data.map((p: any) => ({
          value: p.id,
          label: p.name,
        }));

        setProducts(formatted);
      } catch (err) {
        console.error("❌ Failed to fetch products:", err);
      }
    };

    fetchProducts();
  }, []);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === null || year === null) return;
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === null || year === null) return;
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  if (!mounted || month === null || year === null) return null;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="home-container">
      <div className="calendar-toolbar">
        <div className="toolbar-left">Home</div>
        <div className="toolbar-right">
          <div style={{ width: "220px" }}>
            <Select
              options={products}
              value={selectedProduct}
              onChange={setSelectedProduct}
              placeholder="Select a product"
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  borderColor: "#d1d5db",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#2563eb" },
                }),
              }}
            />
          </div>
          <button className="create-btn" onClick={() => router.push("/create-booking")}>
            + Create Booking
          </button>
        </div>
      </div>
      <div className="calendar">
        <div className="calendar-header">
          <button onClick={prevMonth}>‹</button>
          <h2>{monthNames[month]} {year}</h2>
          <button onClick={nextMonth}>›</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sunday</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
              <th>Saturday</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, i) => (
              <tr key={i}>
                {week.map((day, j) => (
                  <td key={j} className={day ? "day" : "empty"}>
                    {day || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
