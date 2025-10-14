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
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [advance, setAdvance] = useState<number>(0);

  const [sameDate, setSameDate] = useState<boolean>(false);
  const [globalDeliveryDate, setGlobalDeliveryDate] = useState<string>("");
  const [globalReturnDate, setGlobalReturnDate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ✅ Calculated values
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [totalDeposit, setTotalDeposit] = useState<number>(0);
  const [returnAmount, setReturnAmount] = useState<number>(0);

  // ✅ Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      const formatted = data.data.map((p: any) => ({
        value: p.id,
        label: p.name,
        price: p.price,
        image: p.images?.[0] || "",
      }));
      setProducts(formatted);
    };
    fetchProducts();
  }, []);

  // ✅ Filter out already selected products
  const getAvailableProducts = (currentId: number) => {
    const selectedIds = productCards
      .filter((p) => p.product && p.id !== currentId)
      .map((p) => p.product?.value);
    return products.filter((p) => !selectedIds.includes(p.value));
  };

  // ✅ Handle field changes
  const handleChange = (id: number, field: keyof ProductCard, value: any) => {
    setProductCards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          if (field === "product" && value) {
            return {
              ...card,
              product: value,
              amount: String(value.price || ""),
            };
          }
          return { ...card, [field]: value };
        }
        return card;
      })
    );
    setErrorMessage("");
  };

  // ✅ Add item
  const handleAddItem = () => {
    const lastCard = productCards[productCards.length - 1];
    if (!lastCard.product || !lastCard.amount || (!sameDate && (!lastCard.deliveryDate || !lastCard.returnDate))) {
      setErrorMessage("⚠️ Please fill in all product details before adding another item.");
      return;
    }

    setErrorMessage("");
    setProductCards((prev) => [
      ...prev,
      { id: Date.now(), product: null, amount: "", deliveryDate: "", returnDate: "" },
    ]);
  };

  // ✅ Remove item
  const handleRemoveItem = (id: number) => {
    setProductCards((prev) => prev.filter((card) => card.id !== id));
  };

  // ✅ Sync same delivery/return dates
  useEffect(() => {
    if (sameDate) {
      setProductCards((prev) =>
        prev.map((card) => ({
          ...card,
          deliveryDate: globalDeliveryDate,
          returnDate: globalReturnDate,
        }))
      );
    }
  }, [sameDate, globalDeliveryDate, globalReturnDate]);

  // ✅ Calculate totals dynamically
  useEffect(() => {
    const totalProductAmount = productCards.reduce(
      (sum, card) => sum + (parseFloat(card.amount) || 0),
      0
    );

    let discount = 0;
    if (discountType === "flat") discount = discountValue;
    else discount = (totalProductAmount * discountValue) / 100;

    const rent = Math.max(totalProductAmount - discount, 0);
    const totalDep = (advance || 0) + (deposit || 0);
    const retAmt = totalDep - rent;

    setRentAmount(rent);
    setTotalDeposit(totalDep);
    setReturnAmount(retAmt);
  }, [productCards, discountType, discountValue, deposit, advance]);

  return (
    <div className="booking-page">
      <div className="breadcrumb">
        Home › <span>Create Booking</span>
      </div>

      <div className="booking-container">
        {/* LEFT SIDE */}
        <div className="booking-left">
          {/* Customer Info */}
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
                  <input
                    type="checkbox"
                    checked={sameDate}
                    onChange={(e) => setSameDate(e.target.checked)}
                  />{" "}
                  Same Delivery/Return Date for All
                </label>
              </div>
            </div>

            {sameDate && (
              <div className="form-row date-row">
                <div className="form-group date-input">
                  <label>Delivery Date</label>
                  <input
                    type="date"
                    value={globalDeliveryDate}
                    onChange={(e) => setGlobalDeliveryDate(e.target.value)}
                  />
                </div>
                <div className="form-group date-input">
                  <label>Return Date</label>
                  <input
                    type="date"
                    value={globalReturnDate}
                    onChange={(e) => setGlobalReturnDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Cards */}
          {productCards.map((card) => (
            <div className="card product-card" key={card.id}>
              {productCards.length > 1 && (
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(card.id)}
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

              {!sameDate && (
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
              )}
            </div>
          ))}

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
              <input
                type="number"
                placeholder="Deposit"
                value={deposit}
                onChange={(e) => setDeposit(parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Adv. Payment (₹)</label>
              <input
                type="number"
                placeholder="Adv. Payment"
                value={advance}
                onChange={(e) => setAdvance(parseFloat(e.target.value))}
              />
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

            {/* Discount */}
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
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Notes" maxLength={500}></textarea>
              <div className="notes-count">0 / 500</div>
            </div>
          </div>

          {/* ✅ Summary Auto Calculation */}
          <div className="summary-card">
            <div className="summary-row">
              <span>Rent Amount</span>
              <span>₹ {rentAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Total Deposit</span>
              <span>₹ {totalDeposit.toFixed(2)}</span>
            </div>
            <div className="summary-row discount-row">
              <span>Discount</span>
              <span className="negative">- ₹{discountType === "flat"
                ? discountValue.toFixed(2)
                : ((productCards.reduce((sum, card) => sum + (parseFloat(card.amount) || 0), 0) * discountValue) / 100).toFixed(2)
              }</span>
            </div>
            <div className="summary-row">
              <span>Return Amount</span>
              <span>₹ {returnAmount.toFixed(2)}</span>
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
