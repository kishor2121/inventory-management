'use client';

import styles from './import.module.css';
import Link from 'next/link';
import { useState } from 'react';

export default function ImportProductPage() {
  const [file, setFile] = useState<File | null>(null);
  const [gender, setGender] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

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
    setFile(null); // reset
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setFile(null); // reset
  };

  const categories = gender === 'Men' ? menCategories :
                     gender === 'Women' ? womenCategories : [];

  const isFileInputEnabled = gender !== '' && category !== '';
  const isImportEnabled = isFileInputEnabled && file !== null;

  const handleImport = async () => {
    if (!file || !gender || !category) {
      alert('Please select gender, category, and a CSV file.');
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

      if (res.ok) {
        alert(`✅ Import Success: ${data.message || 'CSV imported.'}`);
        // Reset form
        setGender('');
        setCategory('');
        setFile(null);
      } else {
        alert(`❌ Import Failed: ${data.message || 'Something went wrong.'}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Error importing file.');
    } finally {
      setIsImporting(false);
    }
  };

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

        <div className={styles.actions}>
          <button
            className={styles.discardBtn}
            onClick={() => {
              setGender('');
              setCategory('');
              setFile(null);
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
