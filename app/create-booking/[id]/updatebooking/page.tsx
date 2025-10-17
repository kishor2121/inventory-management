"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { useRouter, useParams } from "next/navigation";
import "./update.css";

interface ProductOption {
  value: string;
  label: string;
  price: number;
  image: string;
  size?: string[];
}

interface ProductCard {
  id: number;
  product: ProductOption | null;
  size: string;
  amount: string;
  deliveryDate: string;
  returnDate: string;
}

export default function UpdateBooking() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id;

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productCards, setProductCards] = useState<ProductCard[]>([]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [securityDeposit, setDeposit] = useState<number>(0);
  const [advance, setAdvance] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [sameDate, setSameDate] = useState<boolean>(false);
  const [globalDeliveryDate, setGlobalDeliveryDate] = useState<string>("");
  const [globalReturnDate, setGlobalReturnDate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [totalDeposit, setTotalDeposit] = useState<number>(0);
  const [returnAmount, setReturnAmount] = useState<number>(0);
  const [errors, setErrors] = useState({
    customerName: "",
    phoneNumber: "",
    bookingType: "",
    product: "",
    deliveryDate: "",
    returnDate: "",
    securityDeposit: "",
    advance: "",
    paymentMode: "",
  });

  const [selectedBookingType, setSelectedBookingType] = useState<string>("");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("");

  // Fetch products list
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      const formatted = data.data.map((p: any) => ({
        value: p.id,
        label: p.name,
        price: p.price,
        image: p.images?.[0] || "",
        size: p.size?.length ? p.size : [],
      }));
      setProducts(formatted);
    };
    fetchProducts();
  }, []);

  // Fetch existing booking
  useEffect(() => {
    const fetchBooking = async () => {
      const res = await fetch(`/api/booking/${bookingId}`);
      const data = await res.json();
      const booking = data.data;

      // Prefill amounts
      setDiscountValue(booking.discount || 0);
      setAdvance(booking.advancePayment || 0);
      setDeposit((booking.totalDeposit || 0) - (booking.advancePayment || 0));
      setRentAmount(booking.rentAmount || 0);
      setTotalDeposit(booking.totalDeposit || 0);
      setReturnAmount(booking.returnAmount || 0);

      // Prefill product cards
      if (booking.productLocks && booking.productLocks.length) {
        const cards: ProductCard[] = booking.productLocks.map((lock: any, idx: number) => ({
          id: idx + 1,
          product: lock.product
            ? {
                value: lock.product.id,
                label: lock.product.name,
                price: lock.product.price,
                image: lock.product.images?.[0] || "",
                size: lock.product.size?.length ? lock.product.size : [],
              }
            : null,
          size: lock.product?.size?.[0] || "",
          amount: String(lock.product?.price || 0),
          deliveryDate: lock.deliveryDate.split("T")[0],
          returnDate: lock.returnDate.split("T")[0],
        }));
        setProductCards(cards);

        const firstDelivery = cards[0].deliveryDate;
        const firstReturn = cards[0].returnDate;
        const allSame = cards.every(c => c.deliveryDate === firstDelivery && c.returnDate === firstReturn);
        if (allSame) {
          setSameDate(true);
          setGlobalDeliveryDate(firstDelivery);
          setGlobalReturnDate(firstReturn);
        }
      }

      // Prefill customer info
      const customerInput = document.querySelector<HTMLInputElement>('input[placeholder="Enter customer name"]');
      if (customerInput) customerInput.value = booking.customerName || "";
      const phoneInput = document.querySelector<HTMLInputElement>('input[placeholder="Enter mobile number"]');
      if (phoneInput) phoneInput.value = booking.phoneNumberPrimary || "";
      const altInput = document.querySelector<HTMLInputElement>('input[placeholder="Enter alternate number"]');
      if (altInput) altInput.value = booking.phoneNumberSecondary || "";
      const notesInput = document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Notes"]');
      if (notesInput) notesInput.value = booking.notes || "";

      // Prefill booking type & payment mode
      setSelectedBookingType(booking.rentalType || "");
      setSelectedPaymentMode(booking.advancePaymentMethod || "");
    };
    fetchBooking();
  }, [bookingId]);

  const getAvailableProducts = (currentId: number) => {
    const selectedIds = productCards
      .filter((p) => p.product && p.id !== currentId)
      .map((p) => p.product?.value);
    return products.filter((p) => !selectedIds.includes(p.value));
  };

  const handleChange = (id: number, field: keyof ProductCard, value: any) => {
    setProductCards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          if (field === "product" && value) {
            return {
              ...card,
              product: value,
              size: value.size && value.size.length === 1 ? value.size[0] : "",
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

  const handleAddItem = () => {
    const lastCard = productCards[productCards.length - 1];
    if (!lastCard.product || !lastCard.amount || (!sameDate && (!lastCard.deliveryDate || !lastCard.returnDate))) {
      setErrorMessage("⚠️ Please fill all product details before adding another item.");
      return;
    }
    setProductCards((prev) => [
      ...prev,
      { id: Date.now(), product: null, size: "", amount: "", deliveryDate: "", returnDate: "" },
    ]);
    setErrorMessage("");
  };

  const handleRemoveItem = (id: number) => {
    setProductCards((prev) => prev.filter((card) => card.id !== id));
  };

  useEffect(() => {
    if (sameDate) {
      setProductCards((prev) =>
        prev.map((card) => ({ ...card, deliveryDate: globalDeliveryDate, returnDate: globalReturnDate }))
      );
    }
  }, [sameDate, globalDeliveryDate, globalReturnDate]);

  useEffect(() => {
    const totalProductAmount = productCards.reduce((sum, card) => sum + (parseFloat(card.amount) || 0), 0);
    const discount = discountValue || 0;
    const extras = additionalCharges || 0;
    const baseRent = Math.max(totalProductAmount - discount, 0);
    const rentWithExtras = baseRent + extras;
    const totalDep = (advance || 0) + (securityDeposit || 0);
    const retAmt = totalDep - rentWithExtras;

    setRentAmount(rentWithExtras);
    setTotalDeposit(totalDep);
    setReturnAmount(retAmt);
  }, [productCards, discountValue, securityDeposit, advance, additionalCharges]);

  const safeNumber = (val: string) => (isNaN(parseFloat(val)) ? 0 : parseFloat(val));

  const handleBooking = async () => {
    const customerName = (document.querySelector<HTMLInputElement>('input[placeholder="Enter customer name"]')?.value || "").trim();
    const phoneNumber = (document.querySelector<HTMLInputElement>('input[placeholder="Enter mobile number"]')?.value || "").trim();

    let newErrors: any = {};
    if (!customerName) newErrors.customerName = "Customer Name is required.";
    if (!phoneNumber) newErrors.phoneNumber = "Mobile No. is required.";
    if (!selectedBookingType) newErrors.bookingType = "Booking Type is required.";

    const firstProduct = productCards[0];
    if (!firstProduct.product) newErrors.product = "Please select a product.";
    if (!firstProduct.deliveryDate && !sameDate) newErrors.deliveryDate = "Delivery date is required.";
    if (!firstProduct.returnDate && !sameDate) newErrors.returnDate = "Return date is required.";
    if (!securityDeposit) newErrors.securityDeposit = "Deposit Amount is required.";
    if (!advance) newErrors.advance = "Adv. Payment is required.";
    if (!selectedPaymentMode) newErrors.paymentMode = "Payment mode is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const productsData = productCards.map((card) => ({
      productId: card.product?.value,
      deliveryDate: card.deliveryDate,
      returnDate: card.returnDate,
    }));

    const phoneNumberSecondary = (document.querySelector<HTMLInputElement>('input[placeholder="Enter alternate number"]')?.value || "").trim();
    const notes = (document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Notes"]')?.value || "").trim();

    const formData = new FormData();
    formData.append("id", bookingId);
    formData.append("customerName", customerName);
    formData.append("phoneNumberPrimary", phoneNumber);
    formData.append("phoneNumberSecondary", phoneNumberSecondary);
    formData.append("notes", notes);
    formData.append("rentAmount", String(rentAmount));
    formData.append("totalDeposit", String(totalDeposit));
    formData.append("returnAmount", String(returnAmount));
    formData.append("advancePayment", String(advance));
    formData.append("discount", String(discountValue));
    formData.append("discountType", "flat");
    formData.append("rentalType", selectedBookingType); // Updated key
    formData.append("advancePaymentMethod", selectedPaymentMode); // Updated key
    formData.append("products", JSON.stringify(productsData));
    formData.append("securityDeposit", String(securityDeposit));
    formData.append("bookingId", bookingId);

    try {
      const res = await fetch("/api/booking/update-booking", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "⚠️ Failed to update booking.");
        return;
      }

      setErrorMessage("");
      alert("✅ Booking updated successfully!");
      router.push(`/orders/${bookingId}`);
    } catch (err) {
      console.error(err);
      setErrorMessage("⚠️ Something went wrong. Please try again.");
    }
  };

  return (
    <div className="booking-page">
      <div className="breadcrumb">Home › <span>Update Booking</span></div>
      <div className="booking-container">
        <div className="booking-left">
          <div className="card">
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" placeholder="Enter customer name" />
                {errors.customerName && <span className="error-text">{errors.customerName}</span>}
              </div>
              <div className="form-group">
                <label>Mobile No.</label>
                <input type="text" placeholder="Enter mobile number" />
                {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
              </div>
              <div className="form-group">
                <label>Alternate No.</label>
                <input type="text" placeholder="Enter alternate number" />
              </div>
            </div>

            <div className="form-row align-center">
              <div className="form-group booking-type">
                <label>Booking Type</label>
                <select value={selectedBookingType} onChange={(e) => setSelectedBookingType(e.target.value)}>
                  <option value="">Select Booking Type</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Other">Other</option>
                </select>
                {errors.bookingType && <span className="error-text">{errors.bookingType}</span>}
              </div>
              <div className="checkbox-right">
                <label>
                  <input type="checkbox" checked={sameDate} onChange={(e) => setSameDate(e.target.checked)} /> Same Delivery/Return Date for All
                </label>
              </div>
            </div>

            {sameDate && (
              <div className="form-row date-row">
                <div className="form-group date-input">
                  <label>Delivery Date</label>
                  <input type="date" value={globalDeliveryDate} onChange={(e) => setGlobalDeliveryDate(e.target.value)} />
                </div>
                <div className="form-group date-input">
                  <label>Return Date</label>
                  <input type="date" value={globalReturnDate} onChange={(e) => setGlobalReturnDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {productCards.map((card) => (
            <div className="card product-card" key={card.id}>
              {productCards.length > 1 && <button className="remove-btn" onClick={() => handleRemoveItem(card.id)}>×</button>}
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Product Name</label>
                  <Select options={getAvailableProducts(card.id)} value={card.product} onChange={(val) => handleChange(card.id, "product", val)} placeholder="Select a product" isSearchable />
                  {errors.product && <span className="error-text">{errors.product}</span>}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Amount</label>
                  <input type="number" placeholder="Amount" value={card.amount === "0" ? "" : card.amount} onChange={(e) => handleChange(card.id, "amount", e.target.value)} />
                </div>
              </div>

              {!sameDate && (
                <div className="form-row date-row">
                  <div className="form-group date-input">
                    <label>Delivery Date</label>
                    <input type="date" value={card.deliveryDate} onChange={(e) => handleChange(card.id, "deliveryDate", e.target.value)} />
                    {errors.deliveryDate && <span className="error-text">{errors.deliveryDate}</span>}
                  </div>
                  <div className="form-group date-input">
                    <label>Return Date</label>
                    <input type="date" value={card.returnDate} onChange={(e) => handleChange(card.id, "returnDate", e.target.value)} />
                    {errors.returnDate && <span className="error-text">{errors.returnDate}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="add-item-row">
            <button className="add-item-btn" onClick={handleAddItem}>＋ Add Item</button>
          </div>
        </div>

        <div className="booking-right">
          <div className="card">
            <div className="form-group">
              <label>Deposit (₹)</label>
              <input type="number" placeholder="Deposit" value={securityDeposit === 0 ? "" : securityDeposit} onChange={(e) => setDeposit(safeNumber(e.target.value))} />
              {errors.securityDeposit && <span className="error-text">{errors.securityDeposit}</span>}
            </div>

            <div className="form-group">
              <label>Adv. Payment (₹)</label>
              <input type="number" placeholder="Adv. Payment" value={advance === 0 ? "" : advance} onChange={(e) => setAdvance(safeNumber(e.target.value))} />
              {errors.advance && <span className="error-text">{errors.advance}</span>}
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select value={selectedPaymentMode} onChange={(e) => setSelectedPaymentMode(e.target.value)}>
                <option value="">Select Payment Mode</option>
                <option value="Cash">Cash</option>
                <option value="Card">Bank</option>
              </select>
              {errors.paymentMode && <span className="error-text">{errors.paymentMode}</span>}
            </div>

            <div className="form-group">
              <label>Additional Charges (₹)</label>
              <input type="number" placeholder="Additional Charges" value={additionalCharges === 0 ? "" : additionalCharges} onChange={(e) => setAdditionalCharges(safeNumber(e.target.value))} />
            </div>

            <div className="form-group">
              <label>Discount (₹)</label>
              <input type="number" placeholder="Discount" value={discountValue === 0 ? "" : discountValue} onChange={(e) => setDiscountValue(safeNumber(e.target.value))} />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Notes" maxLength={500}></textarea>
              <div className="notes-count">0 / 500</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-row"><span>Rent Amount</span><span>₹ {rentAmount.toFixed(2)}</span></div>
            <div className="summary-row"><span>Total Deposit</span><span>₹ {totalDeposit.toFixed(2)}</span></div>
            <div className="summary-row discount-row"><span>Discount</span><span className="negative">- ₹{(discountValue || 0).toFixed(2)}</span></div>
            <div className="summary-row"><span>Return Amount</span><span>₹ {returnAmount.toFixed(2)}</span></div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => router.back()}>Cancel</button>
            <button className="save-btn" onClick={handleBooking}>Update Booking</button>
          </div>
        </div>
      </div>
    </div>
  );
}
