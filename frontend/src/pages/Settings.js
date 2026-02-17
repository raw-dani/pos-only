import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../utils/api';
import { getUserRole, isAdmin } from '../utils/auth';

const Settings = () => {
const [settings, setSettings] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    storeWhatsApp: '',
    storeInstagram: '',
    storeFacebook: '',
    storeTwitter: '',
    taxRate: 0,
    taxEnabled: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.put(`${API_BASE_URL}/api/settings`, settings, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (!isAdmin()) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F9FF',
        fontFamily: 'Arial, sans-serif',
        padding: '24px'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#EF4444' }}>Access Denied</h2>
          <p style={{ color: '#6B7280' }}>You do not have permission to access this page.</p>
          <button
            onClick={() => window.location.href = '/pos'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2D8CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Back to POS
          </button>
        </div>
      </div>
    );
  }

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
          ⚙️ Settings
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.location.href = '/pos'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2D8CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ← Back to POS
          </button>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Messages */}
        {message && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #10B981'
          }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #EF4444'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Store Information */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{
              color: '#1F2937',
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: '12px'
            }}>
              🏪 Store Information
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  Store Name *
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter store name"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  Address
                </label>
                <textarea
                  name="storeAddress"
                  value={settings.storeAddress}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Enter store address"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    name="storePhone"
                    value={settings.storePhone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="storeEmail"
                    value={settings.storeEmail}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="store@email.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{
              color: '#1F2937',
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: '12px'
            }}>
              📱 Contact & Social Media
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  WhatsApp
                </label>
                <input
                  type="text"
                  name="storeWhatsApp"
                  value={settings.storeWhatsApp}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="WhatsApp number (e.g., 6281234567890)"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                    Instagram
                  </label>
                  <input
                    type="text"
                    name="storeInstagram"
                    value={settings.storeInstagram}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                    Facebook
                  </label>
                  <input
                    type="text"
                    name="storeFacebook"
                    value={settings.storeFacebook}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Facebook page"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                    Twitter/X
                  </label>
                  <input
                    type="text"
                    name="storeTwitter"
                    value={settings.storeTwitter}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>
          </div>

{/* Tax Settings */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{
              color: '#1F2937',
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: '12px'
            }}>
              💰 Tax Settings
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <div
                  onClick={() => setSettings(prev => ({ ...prev, taxEnabled: !prev.taxEnabled }))}
                  style={{
                    width: '48px',
                    height: '24px',
                    backgroundColor: settings.taxEnabled ? '#10B981' : '#D1D5DB',
                    borderRadius: '24px',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: settings.taxEnabled ? '26px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <span style={{ marginLeft: '12px', fontWeight: '500', color: '#374151' }}>
                  Enable Tax
                </span>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                disabled={!settings.taxEnabled}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: settings.taxEnabled ? '#FFFFFF' : '#F3F4F6',
                  color: settings.taxEnabled ? '#1F2937' : '#9CA3AF',
                  cursor: settings.taxEnabled ? 'auto' : 'not-allowed'
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading ? '#A7D3FF' : '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
