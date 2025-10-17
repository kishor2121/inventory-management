'use client';

import styles from './import.module.css';
import Link from 'next/link';
import { useState } from 'react';

export default function ImportProductPage() {
  const [file, setFile] = useState<File | null>(null);
  const [gender, setGender] = useState<string>('');

  const menCategories = ['Blazer', 'Sherwani', 'Shirt', 'Pant'];
  const womenCategories = ['Chaniya-Choli', 'Gown', 'Overcoat'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGender(e.target.value);
  };

  const categories =
    gender === 'Men' ? menCategories :
    gender === 'Women' ? womenCategories : [];

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

        <select className={styles.select}>
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className={styles.fileDrop}>
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <p>Select a CSV file to import<br />(Max: 1MB)</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.discardBtn}>Discard</button>
          <button className={styles.importBtn}>Import</button>
        </div>
      </div>
    </div>
  );
}
