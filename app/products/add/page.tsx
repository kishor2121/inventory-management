'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    imageUrl: '',
    gender: 'Men',
    category: '',
    size: '',
    status: 'in Laundry',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (gender: 'Men' | 'Women') => {
    setForm((prev) => ({ ...prev, gender }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      images: [form.imageUrl],
      organizationId: '687b44b825e5a8e58023cfd5',
    };

    try {
      const res = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Product added successfully');
        router.push('/products');
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (err) {
      alert('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Add Product</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800 }}>

        {/* Gender */}
        <div>
          <label>Gender Type:</label>
          <div>
            <label>
              <input
                type="radio"
                name="gender"
                checked={form.gender === 'Men'}
                onChange={() => handleGenderChange('Men')}
              /> Men
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="radio"
                name="gender"
                checked={form.gender === 'Women'}
                onChange={() => handleGenderChange('Women')}
              /> Women
            </label>
          </div>
        </div>

        {/* SKU, Name */}
        <input type="text" name="sku" placeholder="SKU" value={form.sku} onChange={handleChange} />
        <input type="text" name="name" placeholder="Product Name" value={form.name} onChange={handleChange} />

        {/* Category, Price, Size */}
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="">Select category</option>
          <option value="Chaniya-Choli">Chaniya-Choli</option>
          <option value="Saree">Saree</option>
        </select>

        <input type="number" name="price" placeholder="Enter Amount" value={form.price} onChange={handleChange} />
        <select name="size" value={form.size} onChange={handleChange}>
          <option value="">Select size</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
        </select>

        {/* Image */}
        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={handleChange}
        />

        {/* Description */}
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          maxLength={1000}
          rows={4}
        />

        {/* Submit */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push('/products')}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : '+ Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
