import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../utils/api';
import { getUserRole, isAdmin, isManager } from '../utils/auth';
import Footer from '../components/Footer';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showPendingOrders, setShowPendingOrders] = useState(false);

  // Load pending orders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pendingOrders');
    if (saved) {
      try {
        setPendingOrders(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading pending orders:', e);
      }
    }
  }, []);

  // Save pending orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  const saveAsPending = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const orderName = prompt('Enter a name for this pending order:', `Order ${pendingOrders.length + 1}`);
    if (!orderName) return;

    const newPendingOrder = {
      id: Date.now(),
      name: orderName,
      items: [...cart],
      total: total,
      createdAt: new Date().toISOString()
    };

    setPendingOrders([...pendingOrders, newPendingOrder]);
    setCart([]);
    setTotal(0);
    alert('Order saved as pending!');
  };

  const loadPendingOrder = (order) => {
    if (cart.length > 0) {
      if (!confirm('Current cart has items. Replace with this pending order?')) {
        return;
      }
    }

    setCart(order.items);
    setTotal(order.total);
    setShowPendingOrders(false);
  };

  const deletePendingOrder = (orderId) => {
    if (!confirm('Delete this pending order?')) return;
    
    const updated = pendingOrders.filter(o => o.id !== orderId);
    setPendingOrders(updated);
  };

  const clearPendingOrders = () => {
    if (!confirm('Clear all pending orders?')) return;
    setPendingOrders([]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsRes = await axios.get(`${API_BASE_URL}/api/products`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProducts(productsRes.data);

        // Fetch categories
        const categoriesRes = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const updatedCart = cart.map(item =>
        item.product === product.id
          ? {
              ...item,
              quantity: newQuantity,
              price: newQuantity * parseFloat(item.unitPrice)  // Recalculate total price
            }
          : item
      );
      setCart(updatedCart);
      setTotal(updatedCart.reduce((sum, item) => sum + parseFloat(item.price), 0));
    } else {
      const unitPrice = parseFloat(product.price);
      const newItem = {
        product: product.id,
        name: product.name,
        unitPrice: unitPrice,  // Store unit price as number
        quantity: 1,
        price: unitPrice       // Total price = quantity * unitPrice
      };
      const newCart = [...cart, newItem];
      setCart(newCart);
      setTotal(newCart.reduce((sum, item) => sum + parseFloat(item.price), 0));
    }
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return; // Minimum quantity is 1

    const updatedCart = cart.map((item, i) =>
      i === index
        ? {
            ...item,
            quantity: newQuantity,
            price: newQuantity * parseFloat(item.unitPrice)
          }
        : item
    );
    setCart(updatedCart);
    setTotal(updatedCart.reduce((sum, item) => sum + parseFloat(item.price), 0));
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    setTotal(newCart.reduce((sum, item) => sum + parseFloat(item.price), 0));
  };

  // Filter products based on selected category and active status
  const filteredProducts = selectedCategory
    ? products.filter(product => parseInt(product.categoryId) === parseInt(selectedCategory) && product.isActive)
    : products.filter(product => product.isActive);

  const createInvoice = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      // Format items sesuai dengan yang diharapkan backend
      const formattedItems = cart.map(item => ({
        productId: item.product,  // product ID - use productId instead of product
        name: item.name,        // product name
        quantity: item.quantity,
        price: parseFloat(item.unitPrice),  // unit price per item
        total: parseFloat(item.price)       // total price for this item
      }));

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
      const total = subtotal;

      const invoiceResponse = await axios.post(`${API_BASE_URL}/api/invoices`, { 
        items: formattedItems,
        cashierId: 1, // Default to admin user ID - in production, get from auth
        subtotal: subtotal,
        total: total
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Set current invoice for payment confirmation
      setCurrentInvoice(invoiceResponse.data);
      setShowPaymentConfirm(true);

      // Don't clear cart yet - wait for payment confirmation
    } catch (err) {
      console.error('Create invoice error:', err);
      alert('Error creating invoice: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const confirmPayment = async () => {
    try {
      setLoading(true);
      
      // Get payment methods first
      const methodsRes = await axios.get(`${API_BASE_URL}/api/payment-methods`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const paymentMethods = methodsRes.data;
      
      // Use the first payment method (Cash) as default
      const defaultPaymentMethod = paymentMethods.find(m => m.type === 'cash') || paymentMethods[0];
      
      if (!defaultPaymentMethod) {
        throw new Error('No payment method available');
      }
      
      // Calculate total from invoice items
      const totalAmount = currentInvoice.items.reduce((sum, item) => sum + Number(item.total), 0);
      
      const response = await axios.put(`${API_BASE_URL}/api/invoices/${currentInvoice.id}/pay`,
        { 
          paymentMethodId: defaultPaymentMethod.id,
          amount: totalAmount
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Update current invoice with paid status
      setCurrentInvoice(response.data);

      // Clear cart after successful payment
      setCart([]);
      setTotal(0);

      // Close payment confirmation modal and show invoice modal
      setShowPaymentConfirm(false);
      setShowInvoice(true);

      alert('Payment confirmed successfully! Invoice is now ready to print.');
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('Error confirming payment: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    const invoiceHTML = generateInvoiceHTML(currentInvoice);

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const generateInvoiceHTML = (invoice) => {
    const total = invoice.items.reduce((sum, item) => sum + Number(item.total), 0);
    
    let itemsHTML = '';
    invoice.items.forEach(item => {
      const productName = item.name || (item.product && item.product.name) || 'Product';
      itemsHTML += '<tr>';
      itemsHTML += '<td><div class="product-name">' + productName + '</div></td>';
      itemsHTML += '<td class="quantity">' + item.quantity + '</td>';
      itemsHTML += '<td class="price">Rp ' + Number(item.price).toLocaleString('id-ID') + '</td>';
      itemsHTML += '<td class="price">Rp ' + Number(item.total).toLocaleString('id-ID') + '</td>';
      itemsHTML += '</tr>';
    });

    return '<!DOCTYPE html><html><head><title>Invoice #' + invoice.id + '</title><style>' +
      '@page { margin: 20mm; }' +
      'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1F2937; line-height: 1.6; }' +
      '.invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #E5E7EB; border-radius: 12px; overflow: hidden; position: relative; }' +
      '.paid-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: 900; color: rgba(16, 185, 129, 0.1); z-index: 1; pointer-events: none; user-select: none; }' +
      '.header { background: linear-gradient(135deg, #2D8CFF 0%, #1A73E8 100%); color: white; padding: 30px; text-align: center; }' +
      '.header h1 { margin: 0; font-size: 28px; font-weight: 700; }' +
      '.header h2 { margin: 10px 0 0 0; font-size: 18px; font-weight: 400; opacity: 0.9; }' +
      '.invoice-details { padding: 30px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; }' +
      '.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }' +
      '.detail-item { display: flex; justify-content: space-between; align-items: center; }' +
      '.detail-label { font-weight: 600; color: #6B7280; }' +
      '.detail-value { font-weight: 500; color: #1F2937; }' +
      '.status-badge { padding: 8px 16px; border-radius: 25px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 2px solid; }' +
      '.status-paid { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; border-color: #047857; }' +
      '.items-section { padding: 30px; }' +
      '.section-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #1F2937; }' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden; }' +
      'thead { background: #F3F4F6; }' +
      'th { padding: 15px 20px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }' +
      'td { padding: 15px 20px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }' +
      '.product-name { font-weight: 500; color: #1F2937; }' +
      '.quantity { text-align: center; font-weight: 600; }' +
      '.price { text-align: right; font-weight: 500; }' +
      '.total-section { padding: 30px; background: #F9FAFB; border-top: 2px solid #E5E7EB; }' +
      '.total-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; }' +
      '.total-label { font-size: 18px; font-weight: 600; color: #374151; }' +
      '.total-amount { font-size: 24px; font-weight: 700; color: #059669; }' +
      '.footer { text-align: center; padding: 20px; background: #F3F4F6; color: #6B7280; font-size: 12px; }' +
      '@media print { body { margin: 0; } .invoice-container { border: none; } }' +
      '</style></head><body>' +
      '<div class="invoice-container">' +
      (invoice.status === 'paid' ? '<div class="paid-watermark">PAID</div>' : '') +
      '<div class="header"><h1>POS Invoice System</h1><h2>Invoice #' + invoice.id + '</h2></div>' +
      '<div class="invoice-details"><div class="details-grid">' +
      '<div class="detail-item"><span class="detail-label">Date:</span><span class="detail-value">' + new Date(invoice.createdAt).toLocaleString('id-ID') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Status:</span><span class="status-badge status-paid">✓ ' + invoice.status.toUpperCase() + '</span></div>' +
      '</div></div>' +
      '<div class="items-section"><h3 class="section-title">Items Purchased</h3><table><thead><tr><th>Product Name</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>' +
      itemsHTML +
      '</tbody></table></div>' +
      '<div class="total-section"><div class="total-row"><span class="total-label">Total Amount:</span><span class="total-amount">Rp ' + total.toLocaleString('id-ID') + '</span></div></div>' +
      '<div class="footer"><p>Thank you for your business!</p><p>Generated on ' + new Date().toLocaleString('id-ID') + '</p></div>' +
      '</div></body></html>';
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
          POS Invoice System
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Show Manage Products button only for Admin and Manager */}
          {(isAdmin() || isManager()) && (
            <button
              onClick={() => window.location.href = '/products'}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
            >
              📦 Manage Products
            </button>
          )}
          {/* Show Settings button only for Admin */}
          {isAdmin() && (
            <button
              onClick={() => window.location.href = '/settings'}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6B7280',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
            >
              ⚙️ Settings
            </button>
          )}
{/* Show Reports button for all authenticated users */}
          <button
            onClick={() => window.location.href = '/reports'}
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
            📊 Reports
          </button>
          {/* Pending Orders button */}
          <button
            onClick={() => setShowPendingOrders(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: pendingOrders.length > 0 ? '#8B5CF6' : '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = pendingOrders.length > 0 ? '#7C3AED' : '#4B5563'}
            onMouseLeave={(e) => e.target.style.backgroundColor = pendingOrders.length > 0 ? '#8B5CF6' : '#6B7280'}
          >
            📋 Pending ({pendingOrders.length})
          </button>
          {/* User info and role */}
          <span style={{
            padding: '8px 16px',
            backgroundColor: '#E5E7EB',
            color: '#374151',
            borderRadius: '6px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center'
          }}>
            👤 {getUserRole()}
          </span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
        {/* Products Section */}
        <div style={{ flex: 2 }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB'
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
                Products ({filteredProducts.length})
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{
                  color: '#1F2937',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Filter by Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1F2937',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    minWidth: '150px'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#2D8CFF';
                    e.target.style.boxShadow = '0 2px 4px rgba(45, 140, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                  onClick={() => addToCart(product)}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        border: '1px solid #E5E7EB'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '120px',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9CA3AF',
                      fontSize: '48px'
                    }}>
                      📷
                    </div>
                  )}
                  <h3 style={{
                    color: '#1F2937',
                    margin: '0 0 8px 0',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}>
                    {product.name}
                  </h3>
                  <p style={{
                    color: '#10B981',
                    margin: '0',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    Rp {parseFloat(product.price).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div style={{ flex: 1 }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            position: 'sticky',
            top: '24px'
          }}>
            <h2 style={{
              color: '#1F2937',
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Cart ({cart.length} items)
            </h2>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {cart.length === 0 ? (
                <p style={{
                  color: '#6B7280',
                  textAlign: 'center',
                  margin: '40px 0',
                  fontStyle: 'italic'
                }}>
                  Cart is empty
                </p>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      backgroundColor: '#F9FAFB'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: '#1F2937',
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {item.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          color: '#6B7280',
                          fontSize: '12px'
                        }}>
                          Rp {parseFloat(item.unitPrice).toLocaleString('id-ID')}
                        </span>
                        <span style={{ color: '#6B7280', fontSize: '12px' }}>×</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(index, item.quantity - 1);
                            }}
                            disabled={item.quantity <= 1}
                            style={{
                              backgroundColor: item.quantity <= 1 ? '#E5E7EB' : '#EF4444',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              fontSize: '14px',
                              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (item.quantity > 1) e.target.style.backgroundColor = '#DC2626';
                            }}
                            onMouseLeave={(e) => {
                              if (item.quantity > 1) e.target.style.backgroundColor = '#EF4444';
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              updateQuantity(index, Math.max(1, newQty));
                            }}
                            min="1"
                            style={{
                              width: '50px',
                              padding: '4px 8px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(index, item.quantity + 1);
                            }}
                            style={{
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        color: '#10B981',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        Rp {parseFloat(item.price).toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(index);
                        }}
                        style={{
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div style={{
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    <span style={{ color: '#1F2937' }}>Total:</span>
                    <span style={{ color: '#10B981' }}>Rp {parseFloat(total).toLocaleString('id-ID')}</span>
                  </div>
                </div>

<button
                  onClick={saveAsPending}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#7C3AED'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#8B5CF6'}
                >
                  📋 Save as Pending
                </button>
                <button
                  onClick={createInvoice}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
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
                  {loading ? 'Creating Invoice...' : 'Create Invoice'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pending Orders Modal */}
      {showPendingOrders && (
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
                📋 Pending Orders ({pendingOrders.length})
              </h2>
              <button
                onClick={() => setShowPendingOrders(false)}
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

            {pendingOrders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6B7280'
              }}>
                <p>No pending orders</p>
                <p style={{ fontSize: '14px' }}>Save current cart as pending to see it here</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  {pendingOrders.map((order, index) => (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <span style={{ fontWeight: '600', color: '#1F2937' }}>
                            {order.name}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            marginLeft: '8px'
                          }}>
                            {new Date(order.createdAt).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => loadPendingOrder(order)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deletePendingOrder(order.id)}
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
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>
                        {order.items.length} items • Total: <span style={{ color: '#10B981', fontWeight: '600' }}>
                          Rp {parseFloat(order.total).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {pendingOrders.length > 0 && (
                  <button
                    onClick={clearPendingOrders}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
                  >
                    🗑️ Clear All Pending Orders
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && currentInvoice && (
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
                Confirm Payment - Invoice #{currentInvoice.id}
              </h2>
              <button
                onClick={() => setShowPaymentConfirm(false)}
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

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '5px 0', color: '#6B7280' }}>
                <strong>Date:</strong> {new Date(currentInvoice.createdAt).toLocaleString()}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Status:</strong>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  backgroundColor: '#F59E0B',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginLeft: '8px'
                }}>
                  PENDING PAYMENT
                </span>
              </p>
            </div>

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
                Payment Summary
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Total Items:</span>
                <span>{currentInvoice.items.reduce((sum, item) => sum + Number(item.quantity), 0)} items</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#10B981'
              }}>
                <span>Total Amount:</span>
                <span>Rp {Number(currentInvoice.items.reduce((sum, item) => sum + Number(item.total), 0)).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPaymentConfirm(false)}
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
                onClick={confirmPayment}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading ? '#A7D3FF' : '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#10B981')}
              >
                {loading ? 'Processing...' : '💰 Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && currentInvoice && (
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
                Invoice #{currentInvoice.id}
              </h2>
              <button
                onClick={() => setShowInvoice(false)}
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

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '5px 0', color: '#6B7280' }}>
                <strong>Date:</strong> {new Date(currentInvoice.createdAt).toLocaleString()}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Status:</strong>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  backgroundColor: '#10B981',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginLeft: '8px'
                }}>
                  {currentInvoice.status.toUpperCase()}
                </span>
              </p>
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '20px',
              border: '1px solid #E5E7EB'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Product</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Qty</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Price</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB'
                  }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoice.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                      <strong>{item.name || item.product?.name || 'Product'}</strong>
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      {item.quantity}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      Rp {Number(item.price).toLocaleString('id-ID')}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      Rp {Number(item.total).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                <span style={{ color: '#1F2937' }}>Total Amount:</span>
                <span style={{ color: '#10B981' }}>
                  Rp {Number(currentInvoice.items.reduce((sum, item) => sum + Number(item.total), 0)).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowInvoice(false);
                  setShowPaymentConfirm(false);
                }}
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
                Close
              </button>

              {currentInvoice.status === 'pending' ? (
                <button
                  onClick={confirmPayment}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading ? '#A7D3FF' : '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#10B981')}
                >
                  {loading ? 'Confirming...' : '💰 Confirm Payment'}
                </button>
              ) : (
                <button
                  onClick={printInvoice}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2D8CFF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1A73E8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2D8CFF'}
                >
                  🖨️ Print Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default POS;
