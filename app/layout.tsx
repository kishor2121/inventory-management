"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide layout on login/sign-in pages
  const hideLayout = pathname === "/login" || pathname === "/sign-in";

  return (
    <html lang="en">
      <body>
        {!hideLayout && (
          <>
            {/* Global Sidebar */}
            <aside className="sidebar">
              <nav>
                <ul>
                  <li>
                    <Link href="/home">Home</Link>
                  </li>
                  <li>
                    <Link href="/delivery">Delivery</Link>
                  </li>
                  <li>
                    <Link href="/return">Return</Link>
                  </li>
                  <li>
                    <Link href="/products">Products</Link>
                  </li>
                  <li>
                    <Link href="/orders">Orders</Link>
                  </li>
                  <li>
                    <Link href="/statistics">Statistics</Link>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* Global Header */}
            <header className="top-bar">
              <div className="user-profile">Hi, Aradhana ▼</div>
            </header>
          </>
        )}

        {/* Page Content */}
        <main className={`main-content ${!hideLayout ? "with-layout" : ""}`}>
          {children}
        </main>
      </body>
    </html>
  );
}
