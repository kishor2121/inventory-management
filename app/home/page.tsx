"use client";

import { useState } from "react";
import "./home.css";

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState("");

  const products = ["Product A", "Product B", "Product C"];

  return (
    <div className="home-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">⚙️</div>
        <nav>
          <ul>
            <li>Home</li>
            <li>Delivery</li>
            <li>Return</li>
            <li>Products</li>
            <li>Orders</li>
            <li>Statistics</li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="top-bar">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button className="create-booking">+ Create Booking</button>
          <div className="user-profile">Hi, Aradhana s ▼</div>
        </header>

        {/* Calendar */}
        <div className="calendar">
          <h2>October 2025</h2>
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
              {/* Fill calendar manually or dynamically */}
              <tr>
                <td>28</td>
                <td>29</td>
                <td>30</td>
                <td>October 1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
              </tr>
              <tr>
                <td>5</td>
                <td>6</td>
                <td>7</td>
                <td>8</td>
                <td>9</td>
                <td>10</td>
                <td>11</td>
              </tr>
              <tr>
                <td>12</td>
                <td>13</td>
                <td>14</td>
                <td>15</td>
                <td>16</td>
                <td>17</td>
                <td>18</td>
              </tr>
              <tr>
                <td>19</td>
                <td>20</td>
                <td>21</td>
                <td>22</td>
                <td>23</td>
                <td>24</td>
                <td>25</td>
              </tr>
              <tr>
                <td>26</td>
                <td>27</td>
                <td>28</td>
                <td>29</td>
                <td>30</td>
                <td>31</td>
                <td>November 1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
