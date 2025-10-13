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
  const [price, setPrice] = useState(''); 
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // category & size options
  const menCategories = ['Shirt', 'Sherwani'];
  const womenCategories = ['Gown', 'Saree'];
  const menSizes = ['34', '36', '38'];
  const womenSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // handle both file input and drag-drop
  const addImages = (files: FileList | File[]) => {
    const validImages = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validImages.length > 0) {
      const newImages = [...images, ...validImages];
      setImages(newImages);
      setPreviewUrls(newImages.map((f) => URL.createObjectURL(f)));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(e.target.files);
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
    if (!name || !sku || !category || !price) {
      alert('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('category', category);
    formData.append('price', price); 
    formData.append('size', size);
    formData.append('description', description);
    formData.append('gender', gender);
    images.forEach((img) => formData.append('images', img));

    const res = await fetch('/api/products', { method: 'POST', body: formData });

    if (res.ok) {
      alert('Product added successfully!');
      router.push('/products'); 
    } else {
      const data = await res.json();
      alert('Error: ' + (data?.message || 'Something went wrong!'));
    }
  };

  const categories =
    gender === 'Men' ? menCategories : gender === 'Women' ? womenCategories : [];
  const sizes =
    gender === 'Men' ? menSizes : gender === 'Women' ? womenSizes : [];

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
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

  {/* Category + Amount + Size */}
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
            <div
              className={`${styles.uploadBox} ${isDragging ? styles.dragOver : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => document.getElementById('upload')?.click()}
            >
              <input
                id="upload"
                type="file"
                multiple
                accept="image/*"
                className={styles.uploadInput}
                onChange={handleImageUpload}
              />
              {previewUrls.length > 0 ? (
                <div className={styles.previewContainer}>
                  {previewUrls.map((src, i) => (
                    <div key={i} className={styles.previewWrapper}>
                      <img src={src} alt={`Preview ${i}`} className={styles.previewImage} />
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveImage(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <span className={styles.addMoreText}>Click or drop more</span>
                </div>
              ) : (
                <p className={styles.uploadText}>
                  Drag & Drop images here or <span className={styles.uploadLink}>Click to select</span>
                  <br />
                  <span className={styles.uploadNote}>
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
          <button type="submit" className={`${styles.button} ${styles.submitButton}`}>
            + Add Product
          </button>
        </div>
      </form>
    </div>
  );
}
