'use client';

import { useState } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import styles from './addProduct.module.css';

export default function AddProductPage() {
  const router = useRouter();

  const [gender, setGender] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const menCategories = ['Blazer', 'Sherwani', 'Shirt', 'Pant'];
  const womenCategories = ['Chaniya-Choli', 'Gown', 'Overcoat'];
  const menSizes = ['34', '36', '38', '40', '42', '44', '46'];
  const womenSizes = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const sizeOptions =
    gender === 'Men'
      ? menSizes.map((s) => ({ value: s, label: s }))
      : gender === 'Women'
      ? womenSizes.map((s) => ({ value: s, label: s }))
      : [];

  const addImages = (files: FileList | File[]) => {
    const validImages = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (validImages.length > 0) {
      const newImages = [...images, ...validImages];
      setImages(newImages);
      setPreviewUrls(newImages.map((f) => URL.createObjectURL(f)));
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(e.target.files);
    }
    e.target.value = ""; 
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addImages(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async () => {
    if (!gender || !name || !sku || !category || !price) {
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
    formData.append('size', size.join(','));
    formData.append('description', description);
    formData.append('gender', gender);
    images.forEach((img) => formData.append('images', img));

    const res = await fetch('/api/products', { method: 'POST', body: formData });

    setLoading(false);

    if (res.ok) {
      setSuccessMessage('✅ Product added successfully!');
      setTimeout(() => router.push('/products'), 1500);
    } else {
      const data = await res.json();
      alert('Error: ' + (data?.message || 'Something went wrong!'));
    }
  };

  // Allow only letters and spaces
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setName(value);
    }
  };

  // Allow only numbers and prevent negative
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {   // Only digits allowed
      setPrice(value);
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
        <span className={styles.breadcrumbActive}>Add Product</span>
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className={styles.row}>
          <label className={styles.required}>Gender Type:</label>
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

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.required}>SKU</label>
            <input
              className={styles.input}
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required}>Product Name</label>
            <input
                className={styles.input}
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Product Name"
            />

          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.required}>Category</label>
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
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required}>Price (₹)</label>
            <input
              className={styles.input}
              type="text"
              value={price}
              onChange={handlePriceChange}
              placeholder="Enter Price"
              inputMode="numeric"
            />

          </div>

          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label>Size</label>
            <Select
              isMulti
              options={sizeOptions}
              value={sizeOptions.filter((opt) => size.includes(opt.value))}
              onChange={(selected) => setSize(selected.map((opt) => opt.value))}
              placeholder="Select size(s)"
              isDisabled={!gender}
            />
          </div>
        </div>

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
              <div
                className={`${styles.uploadBox} ${isDragging ? styles.dragOver : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrls.length > 0 ? (
                  <div className={styles.previewContainer}>
                    {previewUrls.map((src, i) => (
                      <div key={i} className={styles.previewWrapper}>
                        <img src={src} alt={`Preview ${i}`} className={styles.previewImage} />
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ prevent triggering click to upload again
                            handleRemoveImage(i);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <span className={styles.addMoreText}>Click or drop more</span>
                  </div>
                ) : (
                  <p className={styles.uploadText}>
                    Drag & Drop images here or{' '}
                    <span className={styles.uploadLink}>Click to select</span>
                    <br />
                    <span className={styles.uploadNote}>
                      Supported: PNG, JPG, JPEG — Max 25MB
                    </span>
                  </p>
                )}
              </div>

              {/* ✅ Place input OUTSIDE box & hide it */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) addImages(e.target.files);
                  e.target.value = ''; // ✅ reset safely
                }}
              />

          </div>
        </div>

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
            {loading ? <span className={styles.loader}></span> : '+ Add Product'}
          </button>
        </div>

        {successMessage && (
          <p className={styles.successMessage}>{successMessage}</p>
        )}
      </form>
    </div>
  );
}
