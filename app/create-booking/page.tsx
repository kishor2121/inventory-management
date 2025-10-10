"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import "./createBooking.css";

interface ProductOption {
  value: string;
  label: string;
  price: number;
  image: string;
}

interface ProductCard {
  id: number;
  product: ProductOption | null;
  amount: string;
  deliveryDate: string;
  returnDate: string;
}

export default function CreateBooking() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productCards, setProductCards] = useState<ProductCard[]>([
    { id: 1, product: null, amount: "", deliveryDate: "", returnDate: "" },
  ]);
  const [discountType, setDiscountType] = useState<"flat" | "percentage">("flat");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ✅ Fetch product list (with price + image)
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      const formatted = data.data.map((p: any) => ({
        value: p.id,
        label: p.name,
        price: p.price,
        image: p.images?.[0] || "", // optional image
      }));
      setProducts(formatted);
    };
    fetchProducts();
  }, []);

  // ✅ Filter out already selected products from dropdown options
  const getAvailableProducts = (currentId: number) => {
    const selectedIds = productCards
      .filter((p) => p.product && p.id !== currentId)
      .map((p) => p.product?.value);
    return products.filter((p) => !selectedIds.includes(p.value));
  };

  // ✅ Handle input changes
  const handleChange = (id: number, field: keyof ProductCard, value: any) => {
    setProductCards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          if (field === "product" && value) {
            return {
              ...card,
              product: value,
              amount: String(value.price || ""), // auto-fill amount
            };
          }
          return { ...card, [field]: value };
        }
        return card;
      })
    );
    setErrorMessage("");
  };

  // ✅ Add new product card (only if all required fields are filled)
  const handleAddItem = () => {
    const lastCard = productCards[productCards.length - 1];

    if (
      !lastCard.product ||
      !lastCard.amount ||
      !lastCard.deliveryDate ||
      !lastCard.returnDate
    ) {
      setErrorMessage("⚠️ Please fill in all product details before adding another item.");
      return;
    }

    setErrorMessage(""); // clear error
    setProductCards((prev) => [
      ...prev,
      { id: Date.now(), product: null, amount: "", deliveryDate: "", returnDate: "" },
    ]);
  };

  // ✅ Remove card
  const handleRemoveItem = (id: number) => {
    setProductCards((prev) => prev.filter((card) => card.id !== id));
    setErrorMessage("");
  };

  return (
    <div className="booking-page">
      <div className="breadcrumb">
        Home › <span>Create Booking</span>
      </div>

      <div className="booking-container">
        {/* LEFT SIDE */}
        <div className="booking-left">
          {/* Customer Info Card */}
          <div className="card">
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" placeholder="Enter customer name" />
              </div>
              <div className="form-group">
                <label>Mobile No.</label>
                <input type="text" placeholder="Enter mobile number" />
              </div>
              <div className="form-group">
                <label>Alternate No.</label>
                <input type="text" placeholder="Enter alternate number" />
              </div>
            </div>

            <div className="form-row align-center">
              <div className="form-group booking-type">
                <label>Booking Type</label>
                <select>
                  <option>Select Booking Type</option>
                  <option>Engagement</option>
                  <option>Wedding</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="checkbox-right">
                <label>
                  <input type="checkbox" /> Same Delivery/Return Date for All
                </label>
              </div>
            </div>
          </div>

          {/* Product Cards */}
          {productCards.map((card) => (
            <div className="card product-card" key={card.id}>
              {productCards.length > 1 && (
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(card.id)}
                  title="Remove item"
                >
                  ×
                </button>
              )}

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Product Name</label>
                  <Select
                    options={getAvailableProducts(card.id)}
                    value={card.product}
                    onChange={(val) => handleChange(card.id, "product", val)}
                    placeholder="Select a product"
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: "6px",
                        borderColor: "#d1d5db",
                        boxShadow: "none",
                        "&:hover": { borderColor: "#2563eb" },
                      }),
                    }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Amount</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={card.amount}
                    onChange={(e) => handleChange(card.id, "amount", e.target.value)}
                  />
                </div>
              </div>

             {card.product?.image && (
                <div className="selected-product-preview image-only">
                    <img src={card.product.image} alt={card.product.label} />
                </div>
                )}


              <div className="form-row date-row">
                <div className="form-group date-input">
                  <label>Delivery Date</label>
                  <input
                    type="date"
                    value={card.deliveryDate}
                    onChange={(e) =>
                      handleChange(card.id, "deliveryDate", e.target.value)
                    }
                  />
                </div>

                <div className="form-group date-input">
                  <label>Return Date</label>
                  <input
                    type="date"
                    value={card.returnDate}
                    onChange={(e) =>
                      handleChange(card.id, "returnDate", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Error Message */}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="add-item-row">
            <button className="add-item-btn" onClick={handleAddItem}>
              ＋ Add Item
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="booking-right">
          <div className="card">
            <div className="form-group">
              <label>Deposit (₹)</label>
              <input type="number" placeholder="Deposit" />
            </div>
            <div className="form-group">
              <label>Adv. Payment (₹)</label>
              <input type="number" placeholder="Adv. Payment" />
            </div>
            <div className="form-group">
              <label>Payment Mode</label>
              <select>
                <option>Select Payment Mode</option>
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
              </select>
            </div>

            {/* Discount Section */}
            <div className="form-group">
              <label>Discount</label>
              <div className="discount-section">
                <div className="discount-type">
                  <button
                    className={discountType === "flat" ? "active" : ""}
                    onClick={() => setDiscountType("flat")}
                  >
                    Flat (₹)
                  </button>
                  <button
                    className={discountType === "percentage" ? "active" : ""}
                    onClick={() => setDiscountType("percentage")}
                  >
                    Percentage (%)
                  </button>
                </div>

                <input
                  type="number"
                  placeholder={
                    discountType === "flat"
                      ? "Enter discount ₹"
                      : "Enter discount %"
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Notes" maxLength={500}></textarea>
              <div className="notes-count">0 / 500</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-row">
              <span>Amount</span>
              <span>₹ 0</span>
            </div>
            <div className="summary-row">
              <span>Deposit</span>
              <span>₹ 0</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>₹ 0</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn">Cancel</button>
            <button className="book-btn">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
