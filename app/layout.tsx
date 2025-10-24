"use client";

import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string; name?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const hideLayout = pathname === "/login" || pathname === "/sign-in" || pathname.startsWith("/e-receipt/");

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

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (showMobileSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileSidebar]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.push("/sign-in");
  };

  return (
    <html lang="en">
      <body>
        {!hideLayout && (
          <>
            {/* Desktop Sidebar */}
            <aside className="sidebar">
              <nav>
                <ul>
                  <li>
                    <a href="/home">
                      <Home className="nav-icon" size={18} /> Home
                    </a>
                  </li>
                  <li>
                    <a href="/delivery">
                      <Truck className="nav-icon" size={18} /> Delivery
                    </a>
                  </li>
                  <li>
                    <a href="/return">
                      <RotateCcw className="nav-icon" size={18} /> Return
                    </a>
                  </li>
                  <li>
                    <a href="/products">
                      <Package className="nav-icon" size={18} /> Products
                    </a>
                  </li>
                  <li>
                    <a href="/orders">
                      <ShoppingBag className="nav-icon" size={18} /> Orders
                    </a>
                  </li>
                  <li>
                    <a href="/statistics">
                      <BarChart3 className="nav-icon" size={18} /> Statistics
                    </a>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {showMobileSidebar && (
              <>
                <div 
                  className="mobile-sidebar-backdrop"
                  onClick={() => setShowMobileSidebar(false)}
                />
                <aside className="mobile-sidebar">
                  <div className="mobile-sidebar-header">
                    <h3>Menu</h3>
                    <button 
                      className="close-mobile-sidebar"
                      onClick={() => setShowMobileSidebar(false)}
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <nav>
                    <ul>
                      <li>
                        <Link href="/home" onClick={() => setShowMobileSidebar(false)}>
                          <Home className="nav-icon" size={18} /> Home
                        </Link>
                      </li>
                      <li>
                        <Link href="/delivery" onClick={() => setShowMobileSidebar(false)}>
                          <Truck className="nav-icon" size={18} /> Delivery
                        </Link>
                      </li>
                      <li>
                        <Link href="/return" onClick={() => setShowMobileSidebar(false)}>
                          <RotateCcw className="nav-icon" size={18} /> Return
                        </Link>
                      </li>
                      <li>
                        <Link href="/products" onClick={() => setShowMobileSidebar(false)}>
                          <Package className="nav-icon" size={18} /> Products
                        </Link>
                      </li>
                      <li>
                        <Link href="/orders" onClick={() => setShowMobileSidebar(false)}>
                          <ShoppingBag className="nav-icon" size={18} /> Orders
                        </Link>
                      </li>
                      <li>
                        <Link href="/statistics" onClick={() => setShowMobileSidebar(false)}>
                          <BarChart3 className="nav-icon" size={18} /> Statistics
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </aside>
              </>
            )}

            {/* Header */}
            <header className="top-bar">
              <button 
                className="hamburger-menu"
                onClick={() => setShowMobileSidebar(true)}
              >
                <Menu size={24} />
              </button>
              
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
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push("/profile");
                      }}
                      className="dropdown-item"
                    >
                      <User className="icon" size={16} /> Profile
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push("/change-password");
                      }}
                      className="dropdown-item"
                    >
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
