"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

// ✅ Importing Lucide icons
import {
  User,
  Lock,
  LogOut,
  Home,
  Truck,
  RotateCcw,
  Package,
  ShoppingBag,
  BarChart3,
} from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const hideLayout = pathname === "/login" || pathname === "/sign-in";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    router.push("/sign-in");
  };

  return (
    <html lang="en">
      <body>
        {!hideLayout && (
          <>
            {/* Sidebar */}
            <aside className="sidebar">
              <nav>
                <ul>
                  <li>
                    <Link href="/home">
                      <Home className="nav-icon" size={18} /> Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/delivery">
                      <Truck className="nav-icon" size={18} /> Delivery
                    </Link>
                  </li>
                  <li>
                    <Link href="/return">
                      <RotateCcw className="nav-icon" size={18} /> Return
                    </Link>
                  </li>
                  <li>
                    <Link href="/products">
                      <Package className="nav-icon" size={18} /> Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/orders">
                      <ShoppingBag className="nav-icon" size={18} /> Orders
                    </Link>
                  </li>
                  <li>
                    <Link href="/statistics">
                      <BarChart3 className="nav-icon" size={18} /> Statistics
                    </Link>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* Header */}
            <header className="top-bar">
              <div
                className="user-profile"
                ref={dropdownRef}
                style={{ position: "relative", cursor: "pointer" }}
              >
                <div onClick={() => setShowDropdown((s) => !s)}>
                  Hi, {user?.name ?? "User"} <span style={{ marginLeft: 6 }}>▼</span>
                </div>

                {showDropdown && (
                  <div className="user-dropdown">
                    <button className="dropdown-item">
                      <User className="icon" size={16} /> Profile
                    </button>
                    <button className="dropdown-item">
                      <Lock className="icon" size={16} /> Change Password
                    </button>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <LogOut className="icon" size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </header>
          </>
        )}

        <main className={`main-content ${!hideLayout ? "with-layout" : ""}`}>
          {children}
        </main>
      </body>
    </html>
  );
}
