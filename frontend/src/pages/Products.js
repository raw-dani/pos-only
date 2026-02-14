
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    image: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({
    status: '',
    priceType: 'fixed', // 'fixed' or 'percentage'
    priceValue: '',
    priceOperation: 'set' // 'set', 'add', 'subtract', 'multiply', 'divide'
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProducts();
    fetchCategories();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('DEBUG PRODUCTS - Fetching products with token:', token);
      const res = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('DEBUG PRODUCTS - Products response:', res.data);
      setProducts(res.data);
    } catch (err) {
      console.error('DEBUG PRODUCTS - Error fetching products:', err);
      console.error('DEBUG PRODUCTS - Error response:', err.response);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('DEBUG PRODUCTS - Fetching categories with token:', token);
      const res = await axios.get('http://localhost:5000/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('DEBUG PRODUCTS - Categories response:', res.data);
      setCategories(res.data);
    } catch (err) {
      console.error('DEBUG PRODUCTS - Error fetching categories:', err);
      console.error('DEBUG PRODUCTS - Error response:', err.response);
      // Fallback to hardcoded categories if API fails
      setCategories([
        { id: 1, name: 'Food & Beverage' },
        { id: 2, name: 'Electronics' },
        { id: 3, name: 'Clothing' },
        { id: 4, name: 'Others' }
      ]);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Debug logging
    const token = localStorage.getItem('token');
    console.log('DEBUG - Token from localStorage:', token);
    console.log('DEBUG - Form data:', formData);

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      console.log('DEBUG - Request config:', config);

      if (editingProduct) {
        console.log('DEBUG - Updating product:', editingProduct.id);
        await axios.put(`http://localhost:5000/api/products/${editingProduct.id}`, formData, config);
        alert('Product updated successfully!');
      } else {
        console.log('DEBUG - Creating new product');
        await axios.post('http://localhost:5000/api/products', formData, config);
        alert('Product created successfully!');
      }

      setFormData({ name: '', categoryId: '', price: '', description: '', isActive: true });
      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('DEBUG - Error details:', err);
      console.error('DEBUG - Error response:', err.response);
      alert('Error saving product: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      description: product.description || '',
      image: product.image || '',
      isActive: product.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Product deleted successfully!');
      fetchProducts();
    } catch (err) {
      alert('Error deleting product');
      console.error(err);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      alert('Please enter category name');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      if (editingCategory) {
        console.log('DEBUG - Updating category:', editingCategory.id);
        await axios.put(`http://localhost:5000/api/categories/${editingCategory.id}`, categoryFormData, config);
        alert('Category updated successfully!');
      } else {
        console.log('DEBUG - Creating new category');
        await axios.post('http://localhost:5000/api/categories', categoryFormData, config);
        alert('Category created successfully!');
      }

      setCategoryFormData({ name: '' });
      setShowCategoryForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('DEBUG - Category error:', err);
      alert('Error saving category: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This may affect products using this category.')) return;

    try {
      await axios.delete(`http://localhost:5000/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Category deleted successfully!');
      fetchCategories();
      fetchProducts(); // Refresh products in case category was deleted
    } catch (err) {
      alert('Error deleting category');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', categoryId: '', price: '', description: '', image: '', isActive: true });
    setEditingProduct(null);
    setShowForm(false);
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        // Auto crop to square when image is loaded
        const img = new Image();
        img.onload = () => {
          const croppedImage = autoCropToSquare(img);
          setFormData({ ...formData, image: croppedImage });
          alert('Image uploaded and cropped to square automatically!');
        };
        img.src = reader.result;
      });
      reader.readAsDataURL(file);
    }
  };

  const autoCropToSquare = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate square crop from center
    const size = Math.min(img.width, img.height);
    const x = (img.width - size) / 2;
    const y = (img.height - size) / 2;

    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      img,
      x, y, size, size,  // Source rectangle (crop area)
      0, 0, size, size   // Destination rectangle (canvas)
    );

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '' });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const updates = {};

      // Handle status update
      if (bulkUpdateData.status !== '') {
        updates.isActive = bulkUpdateData.status === 'active';
      }

      // Handle price update
      if (bulkUpdateData.priceValue && bulkUpdateData.priceValue !== '') {
        const value = parseFloat(bulkUpdateData.priceValue);
        if (isNaN(value)) {
          throw new Error('Invalid price value');
        }

        // We'll need to update each product individually since we need current prices
        for (const productId of selectedProducts) {
          const product = products.find(p => p.id === productId);
          if (!product) continue;

          let newPrice = parseFloat(product.price);

          if (bulkUpdateData.priceType === 'fixed') {
            switch (bulkUpdateData.priceOperation) {
              case 'set':
                newPrice = value;
                break;
              case 'add':
                newPrice += value;
                break;
              case 'subtract':
                newPrice -= value;
                break;
              case 'multiply':
                newPrice *= value;
                break;
              case 'divide':
                newPrice /= value;
                break;
            }
          } else { // percentage
            const percentage = value / 100;
            switch (bulkUpdateData.priceOperation) {
              case 'add':
                newPrice *= (1 + percentage);
                break;
              case 'subtract':
                newPrice *= (1 - percentage);
                break;
            }
          }

          // Update each product
          await axios.put(`http://localhost:5000/api/products/${productId}`,
            { ...updates, price: Math.max(0, newPrice).toFixed(2) },
            config
          );
        }
      } else if (Object.keys(updates).length > 0) {
        // Only status update, apply to all selected
        for (const productId of selectedProducts) {
          await axios.put(`http://localhost:5000/api/products/${productId}`, updates, config);
        }
      }

      alert(`Successfully updated ${selectedProducts.length} product(s)`);
      setSelectedProducts([]);
      setShowBulkUpdate(false);
      setBulkUpdateData({
        status: '',
        priceType: 'fixed',
        priceValue: '',
        priceOperation: 'set'
      });
      fetchProducts();
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('Error updating products: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetBulkUpdateForm = () => {
    setBulkUpdateData({
      status: '',
      priceType: 'fixed',
      priceValue: '',
      priceOperation: 'set'
    });
    setShowBulkUpdate(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F9FF',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          color: '#2D8CFF',
          margin: '0',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Product Management
        </h1>
        <div>
          <button
            onClick={() => window.location.href = '/pos'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#A7D3FF',
              color: '#1A73E8',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              marginRight: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#8BB9FF'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#A7D3FF'}
          >
            ← Back to POS
          </button>
          <button
            onClick={() => setShowCategoryForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              marginRight: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
          >
            📁 Manage Categories
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2D8CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1A73E8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2D8CFF'}
          >
            + Add Product
          </button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Products Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{
                color: '#1F2937',
                margin: '0',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Products ({products.length})
              </h2>
              {selectedProducts.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>
                    {selectedProducts.length} selected
                  </span>
                  <button
                    onClick={() => setShowBulkUpdate(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#F59E0B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#F59E0B'}
                  >
                    Bulk Update
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB',
                    width: '40px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Image</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Name</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Category</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Price</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#6B7280',
                      fontStyle: 'italic'
                    }}>
                      No products found. Click "Add Product" to create your first product.
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} style={{
                      borderBottom: '1px solid #E5E7EB',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: '#F3F4F6',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9CA3AF',
                            fontSize: '20px'
                          }}>
                            📷
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#1F2937' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{product.name}</div>
                          {product.description && (
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                              {product.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#1F2937' }}>
                        {categories.find(cat => cat.id === parseInt(product.categoryId))?.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: '500' }}>
                        Rp {parseFloat(product.price).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: product.isActive ? '#D1FAE5' : '#FEE2E2',
                          color: product.isActive ? '#065F46' : '#991B1B'
                        }}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(product)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#F59E0B',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginRight: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#F59E0B'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage Categories Modal */}
        {showCategoryForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#1F2937',
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Manage Categories
                </h2>
                <button
                  onClick={resetCategoryForm}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6B7280'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Add Category Form */}
              <div style={{
                backgroundColor: '#F9FAFB',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{
                  color: '#1F2937',
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form onSubmit={handleCategorySubmit} style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ name: e.target.value })}
                    placeholder="Enter category name"
                    required
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#1F2937',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: loading ? '#A7D3FF' : '#2D8CFF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1A73E8')}
                    onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2D8CFF')}
                  >
                    {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFormData({ name: '' });
                        setEditingCategory(null);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6B7280',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>

              {/* Categories List */}
              <div style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF'
                }}>
                  <h3 style={{
                    color: '#1F2937',
                    margin: '0',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    Categories ({categories.length})
                  </h3>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {categories.length === 0 ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#6B7280'
                    }}>
                      No categories found.
                    </div>
                  ) : (
                    categories.map(category => (
                      <div key={category.id} style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #E5E7EB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.closest('div').style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.target.closest('div').style.backgroundColor = '#FFFFFF'}
                      >
                        <span style={{
                          color: '#1F2937',
                          fontWeight: '500'
                        }}>
                          {category.name}
                        </span>
                        <div>
                          <button
                            onClick={() => handleEditCategory(category)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#F59E0B',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginRight: '8px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#F59E0B'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#EF4444',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#1F2937',
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={resetForm}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6B7280'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    color: '#1F2937',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#1F2937',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    color: '#1F2937',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#1F2937',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    color: '#1F2937',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Price (Rp) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#1F2937',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    color: '#1F2937',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#1F2937',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{
                    color: '#6B7280',
                    fontSize: '12px',
                    margin: '4px 0 0 0'
                  }}>
                    Image will be automatically cropped to square (1:1) ratio
                  </p>
                  {formData.image && (
                    <div style={{ marginTop: '16px' }}>
                      <img
                        src={formData.image}
                        alt="Product preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                      />
                      <p style={{
                        color: '#10B981',
                        fontSize: '12px',
                        margin: '8px 0 0 0',
                        fontWeight: '500'
                      }}>
                        ✓ Image uploaded and cropped to square
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    color: '#1F2937',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description (optional)"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#1F2937',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#1F2937',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    Active Product
                  </label>
                  <p style={{
                    color: '#6B7280',
                    fontSize: '12px',
                    margin: '4px 0 0 24px'
                  }}>
                    Inactive products won't be displayed in POS
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6B7280',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: loading ? '#A7D3FF' : '#2D8CFF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1A73E8')}
                    onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2D8CFF')}
                  >
                    {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Update Modal */}
        {showBulkUpdate && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#1F2937',
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Bulk Update Products ({selectedProducts.length} selected)
                </h2>
                <button
                  onClick={resetBulkUpdateForm}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6B7280'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleBulkUpdate}>
                {/* Status Update */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: '#1F2937',
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '12px'
                  }}>
                    Update Status
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={bulkUpdateData.status === 'active'}
                        onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, status: e.target.value })}
                        style={{ marginRight: '8px' }}
                      />
                      Set Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={bulkUpdateData.status === 'inactive'}
                        onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, status: e.target.value })}
                        style={{ marginRight: '8px' }}
                      />
                      Set Inactive
                    </label>
                  </div>
                </div>

                {/* Price Update */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: '#1F2937',
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '12px'
                  }}>
                    Update Price
                  </label>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="priceType"
                        value="fixed"
                        checked={bulkUpdateData.priceType === 'fixed'}
                        onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, priceType: e.target.value })}
                        style={{ marginRight: '8px' }}
                      />
                      Fixed Amount
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="priceType"
                        value="percentage"
                        checked={bulkUpdateData.priceType === 'percentage'}
                        onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, priceType: e.target.value })}
                        style={{ marginRight: '8px' }}
                      />
                      Percentage
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                      value={bulkUpdateData.priceOperation}
                      onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, priceOperation: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1F2937',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                    >
                      <option value="set">Set to</option>
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                      <option value="multiply">Multiply by</option>
                      <option value="divide">Divide by</option>
                    </select>
                    <input
                      type="number"
                      value={bulkUpdateData.priceValue}
                      onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, priceValue: e.target.value })}
                      placeholder={bulkUpdateData.priceType === 'percentage' ? '10' : '10000'}
                      min="0"
                      step={bulkUpdateData.priceType === 'percentage' ? '0.01' : '0.01'}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1F2937',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                    />
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>
                      {bulkUpdateData.priceType === 'percentage' ? '%' : 'Rp'}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={resetBulkUpdateForm}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6B7280',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (!bulkUpdateData.status && !bulkUpdateData.priceValue)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: loading ? '#A7D3FF' : '#2D8CFF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: loading || (!bulkUpdateData.status && !bulkUpdateData.priceValue) ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => !loading && bulkUpdateData.status || bulkUpdateData.priceValue && (e.target.style.backgroundColor = '#1A73E8')}
                    onMouseLeave={(e) => !loading && bulkUpdateData.status || bulkUpdateData.priceValue && (e.target.style.backgroundColor = '#2D8CFF')}
                  >
                    {loading ? 'Updating...' : `Update ${selectedProducts.length} Products`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;