'use client';

import { useState } from 'react';
import styles from './addProduct.module.css';

export default function AddProductPage() {
  const [gender, setGender] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);

  // 👇 Category & Size options
  const menCategories = ['Shirt', 'Sherwani'];
  const womenCategories = ['Gown', 'Saree'];
  const menSizes = ['34', '36', '38'];
  const womenSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (!name || !sku || !category || !amount) {
      alert('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('category', category);
    formData.append('amount', amount);
    formData.append('size', size);
    formData.append('description', description);
    formData.append('gender', gender);

    images.forEach((img) => formData.append('images', img));

    const res = await fetch('/api/products', { method: 'POST', body: formData });
    alert(res.ok ? 'Product added successfully!' : 'Something went wrong!');
  };

  // 👇 Dynamic category & size options
  const categories =
    gender === 'Men' ? menCategories : gender === 'Women' ? womenCategories : [];

  const sizes =
    gender === 'Men' ? menSizes : gender === 'Women' ? womenSizes : [];

  return (
    <div className={styles.container}>
      <h1>Add Product</h1>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Gender */}
        <div className={styles.row}>
          <label>Gender Type:</label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Men"
              onChange={(e) => setGender(e.target.value)}
            />{' '}
            Men
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Women"
              onChange={(e) => setGender(e.target.value)}
            />{' '}
            Women
          </label>
        </div>

        {/* SKU & Name */}
        <div className={styles.row}>
          <input
            type="text"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category & Amount & Size */}
        <div className={styles.row}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!gender} // 👈 Disabled until gender selected
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            disabled={!gender} // 👈 Disabled until gender selected
          >
            <option value="">Select size</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <textarea
          placeholder="Description"
          value={description}
          maxLength={1000}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Image Upload */}
        <div className={styles.uploadBox}>
          <label>Upload Images</label>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
        </div>

        {/* Buttons */}
        <div className={styles.actions}>
          <button type="button">Cancel</button>
          <button type="submit">+ Add Product</button>
        </div>
      </form>
    </div>
  );
}
