'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Select from 'react-select';
import styles from '../../add-product/addProduct.module.css';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();

  const [gender, setGender] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // ✅ New message state

  const menCategories = ['Shirt', 'Sherwani'];
  const womenCategories = ['Gown', 'Saree'];
  const menSizes = ['34', '36', '38'];
  const womenSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const sizeOptions =
    gender === 'Men'
      ? menSizes.map((s) => ({ value: s, label: s }))
      : gender === 'Women'
      ? womenSizes.map((s) => ({ value: s, label: s }))
      : [];

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    const p = data.data;

    setName(p.name || '');
    setSku(p.sku || '');
    setCategory(p.category || '');
    setPrice(p.price?.toString() || '');
    setSize(Array.isArray(p.size) ? p.size : typeof p.size === 'string' ? p.size.split(',') : []);
    setDescription(p.description || '');
    setGender(p.gender || '');
    setExistingImages(p.images || []);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    }
  };

  const handleSubmit = async () => {
    if (!name || !sku || !category || !price) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('size', JSON.stringify(size));
    formData.append('description', description);
    formData.append('gender', gender);
    formData.append('status', 'available');

    images.forEach((img) => formData.append('images', img));
    existingImages.forEach((url) => formData.append('images', url));

    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      body: formData,
    });

    setLoading(false);

    if (res.ok) {
      setSuccessMessage('✅ Product updated successfully!');
      setTimeout(() => {
        router.push('/products');
      }, 1500);
    } else {
      const data = await res.json();
      alert('Error: ' + (data?.message || 'Something went wrong!'));
    }
  };

  const categories =
    gender === 'Men' ? menCategories : gender === 'Women' ? womenCategories : [];

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => router.push('/products')}>
          Products
        </span>
        <span className={styles.breadcrumbDivider}>›</span>
        <span className={styles.breadcrumbActive}>Edit Product</span>
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
                onChange={(e) => {
                  setGender(e.target.value);
                  setCategory('');
                  setSize([]);
                }}
              />
              Men
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Women"
                checked={gender === 'Women'}
                onChange={(e) => {
                  setGender(e.target.value);
                  setCategory('');
                  setSize([]);
                }}
              />
              Women
            </label>
          </div>
        </div>

        {/* SKU + Name */}
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

        {/* Category + Price + Size */}
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
            placeholder="Enter Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <div style={{ flex: 1 }}>
            <Select
              isMulti
              options={sizeOptions}
              value={sizeOptions.filter((opt) => size.includes(opt.value))}
              onChange={(selected) => setSize(selected.map((opt) => opt.value))}
              placeholder="Select size(s)"
              isDisabled={!gender}
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '8px',
                  borderColor: '#d1d5db',
                  minHeight: '40px',
                  fontSize: '14px',
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#e5e7eb',
                }),
              }}
            />
          </div>
        </div>

        {/* Description + Upload */}
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
              {existingImages.length > 0 || previewUrls.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    justifyContent: 'center',
                  }}
                >
                  {[...existingImages, ...previewUrls].map((src, i) => (
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

        {/* Buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={() => router.push('/products')}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`${styles.button} ${styles.submitButton}`}
            disabled={loading}
          >
            {loading ? <span className={styles.loader}></span> : 'Save Changes'}
          </button>
        </div>

        {/* ✅ Success message below */}
        {successMessage && (
          <p className={styles.successMessage}>{successMessage}</p>
        )}
      </form>
    </div>
  );
}
