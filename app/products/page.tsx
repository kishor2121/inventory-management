'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, ChevronDown } from 'lucide-react';
import styles from './products.module.css';
import Confirmation from '../../components/confirmation';

type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  images?: string[];
  status: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('available');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // for custom dropdown

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.data);
  };

  const openDeleteModal = (id: string) => {
    setSelectedProductId(id);
    setModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedProductId(null);
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (selectedProductId) {
      await fetch(`/api/products/${selectedProductId}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== selectedProductId));
      closeDeleteModal();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    setOpenDropdownId(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) &&
      p.status.toLowerCase() === filter.toLowerCase()
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return styles.statusGreen;
      case 'in laundry':
        return styles.statusBlue;
      case 'archived':
        return styles.statusGray;
      default:
        return '';
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Products</h1>
          <div className={styles.controls}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={styles.select}
            >
              <option value="available">Available</option>
              <option value="in Laundry">In Laundry</option>
              <option value="archived">Archived</option>
            </select>
            <input
              type="text"
              placeholder="Search by SKU"
              className={styles.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link href="/products/add-product" className={styles.addBtn}>
              + Add Product
            </Link>
            <Link href="/products/import-product" className={styles.addBtn}>
              Import
            </Link>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className={styles.imageCell}>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className={styles.productImage}
                    />
                  ) : (
                    <div className={styles.noImage}>No Image</div>
                  )}
                </td>
                <td>{product.sku}</td>
                <td className={styles.productName}>{product.name}</td>
                <td>₹{product.price}</td>
                <td>
                  <div
                    className={`${styles.dropdownWrapper} ${getStatusColor(product.status)}`}
                    onClick={() =>
                      setOpenDropdownId(openDropdownId === product.id ? null : product.id)
                    }
                  >
                    <span className={styles.dropdownText}>{product.status}</span>
                    <ChevronDown size={14} />
                    {openDropdownId === product.id && (
                      <div className={styles.dropdownMenu}>
                        <div
                          className={`${styles.dropdownOption} ${styles.statusGreen}`}
                          onClick={() => handleStatusChange(product.id, 'available')}
                        >
                          Available
                        </div>
                        <div
                          className={`${styles.dropdownOption} ${styles.statusBlue}`}
                          onClick={() => handleStatusChange(product.id, 'in Laundry')}
                        >
                          In Laundry
                        </div>
                        <div
                          className={`${styles.dropdownOption} ${styles.statusGray}`}
                          onClick={() => handleStatusChange(product.id, 'archived')}
                        >
                          Archived
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className={styles.actions}>
                  <Link href={`/products/edit-product/${product.id}`} className={styles.edit}>
                    <Edit2 size={16} />
                  </Link>
                  <button
                    onClick={() => openDeleteModal(product.id)}
                    className={styles.delete}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Confirmation
        isOpen={modalOpen}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        title="Confirm Product Deletion?"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </>
  );
}
