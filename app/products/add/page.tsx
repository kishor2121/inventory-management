'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './addProduct.module.css';

export default function AddProductPage() {
  const router = useRouter();

  const [gender, setGender] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Category & Size options
  const menCategories = ['Shirt', 'Sherwani'];
  const womenCategories = ['Gown', 'Saree'];
  const menSizes = ['34', '36', '38'];
  const womenSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    }
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

  const categories =
    gender === 'Men' ? menCategories : gender === 'Women' ? womenCategories : [];

  const sizes =
    gender === 'Men' ? menSizes : gender === 'Women' ? womenSizes : [];

  return (
    <div className={styles.container}>
      {/* ✅ Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => router.push('/products')}>
          Products
        </span>
        <span className={styles.breadcrumbDivider}>›</span>
        <span className={styles.breadcrumbActive}>Add Product</span>
      </div>

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
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="gender"
                value="Men"
                checked={gender === 'Men'}
                onChange={(e) => setGender(e.target.value)}
              />
              Men
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Women"
                checked={gender === 'Women'}
                onChange={(e) => setGender(e.target.value)}
              />
              Women
            </label>
          </div>
        </div>

        {/* SKU & Name */}
        <div className={styles.row}>
          <input
            className={styles.input}
            type="text"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category, Amount & Size */}
        <div className={styles.row}>
          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!gender}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>

          <input
            className={styles.input}
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            className={styles.select}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            disabled={!gender}
          >
            <option value="">Select size</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Description + Upload section */}
        <div className={styles.gridTwo}>
          <div className={styles.gridItem}>
            <label>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              {description.length} / 1000
            </p>
          </div>

          <div className={styles.gridItem}>
            <label>Upload Images</label>
            <div className={styles.uploadBox}>
              <input
                id="upload"
                type="file"
                multiple
                accept="image/*"
                className={styles.uploadInput}
                onChange={handleImageUpload}
              />
              {previewUrls.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    justifyContent: 'center',
                  }}
                >
                  {previewUrls.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Preview ${i}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.uploadText}>
                  Drag & Drop images here, or{' '}
                  <label htmlFor="upload" style={{ color: '#000', cursor: 'pointer' }}>
                    click to select
                  </label>
                  <br />
                  <span style={{ color: '#9ca3af' }}>
                    Supported: PNG, JPG, JPEG — Max 25MB
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={() => router.push('/products')}
          >
            Cancel
          </button>
          <button type="submit" className={`${styles.button} ${styles.submitButton}`}>
            + Add Product
          </button>
        </div>
      </form>
    </div>
  );
}
