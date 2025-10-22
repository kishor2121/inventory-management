'use client';

import styles from './import.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportProductPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [gender, setGender] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skippedProducts, setSkippedProducts] = useState<Array<{ sku: string, reason: string }>>([]);

  const menCategories = ['Blazer', 'Sherwani', 'Shirt', 'Pant'];
  const womenCategories = ['Chaniya-Choli', 'Gown', 'Overcoat'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGender(e.target.value);
    setCategory('');
    setFile(null);
    setSkippedProducts([]);
    setErrorMessage(null);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setFile(null);
    setSkippedProducts([]);
    setErrorMessage(null);
  };

  const handleImport = async () => {
    setErrorMessage(null);
    setSkippedProducts([]);

    if (!file || !gender || !category) {
      setErrorMessage('⚠️ Please select gender, category, and a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('csv', file);
    formData.append('gender', gender);
    formData.append('category', category);

    setIsImporting(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || '❌ Failed to import products.');
        return;
      }

      if (data.imported > 0) {
        alert(`✅ ${data.imported} product(s) imported.`);

        if (data.skipped && data.skipped.length > 0) {
          setSkippedProducts(data.skipped);
        }

        router.push('/products');
      } else if (data.skipped && data.skipped.length > 0) {
        setSkippedProducts(data.skipped);
        setErrorMessage('❌ No products were imported.');
      } else {
        setErrorMessage('❌ Import failed. No products processed.');
      }

    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage('❌ Something went wrong. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const categories =
    gender === 'Men' ? menCategories :
    gender === 'Women' ? womenCategories :
    [];

  const isFileInputEnabled = gender !== '' && category !== '';
  const isImportEnabled = isFileInputEnabled && file !== null;

  return (
    <div className={styles.importContainer}>
      <nav className={styles.breadcrumb}>
        <Link href="/products">Products</Link> &gt; <span>Import Products</span>
      </nav>

      <div className={styles.importCard}>
        <h2>Import Product CSV</h2>

        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="gender"
              value="Men"
              checked={gender === 'Men'}
              onChange={handleGenderChange}
            /> Men
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Women"
              checked={gender === 'Women'}
              onChange={handleGenderChange}
            /> Women
          </label>
        </div>

        <select
          className={styles.select}
          value={category}
          onChange={handleCategoryChange}
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className={styles.fileDrop}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csvFileInput"
            style={{ display: 'none' }}
            disabled={!isFileInputEnabled}
          />
          <label
            htmlFor="csvFileInput"
            className={`${styles.fileLabel} ${!isFileInputEnabled ? styles.disabledLabel : ''}`}
          >
            {file ? file.name : 'Choose File'}
          </label>
          <p>Select a CSV file to import<br />(Max: 1MB)</p>
        </div>

        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {skippedProducts.length > 0 && (
          <div className={styles.skippedBox}>
            <h4>⚠️ Skipped Products:</h4>
            <ul>
              {skippedProducts.map((item, index) => (
                <li key={index}>
                  <strong>{item.sku}</strong>: {item.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.discardBtn}
            onClick={() => {
              setGender('');
              setCategory('');
              setFile(null);
              setSkippedProducts([]);
              setErrorMessage(null);
            }}
          >
            Discard
          </button>
          <button
            className={`${styles.importBtn} ${!isImportEnabled || isImporting ? styles.disabledBtn : ''}`}
            onClick={handleImport}
            disabled={!isImportEnabled || isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
