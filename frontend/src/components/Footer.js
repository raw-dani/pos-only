import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

const Footer = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  if (!settings) {
    return null;
  }

  const hasInfo = settings.storeName || settings.storeAddress || settings.storePhone || 
                  settings.storeEmail || settings.storeWhatsApp || settings.storeInstagram ||
                  settings.storeFacebook || settings.storeTwitter;

  if (!hasInfo) {
    return null;
  }

  return (
    <footer style={{
      backgroundColor: '#1F2937',
      color: '#FFFFFF',
      padding: '24px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px'
      }}>
        {/* Store Info */}
        {(settings.storeName || settings.storeAddress) && (
          <div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#2D8CFF'
            }}>
              {settings.storeName || 'Toko'}
            </h3>
            {settings.storeAddress && (
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: '#9CA3AF',
                lineHeight: '1.5'
              }}>
                📍 {settings.storeAddress}
              </p>
            )}
          </div>
        )}

        {/* Contact Info */}
        {(settings.storePhone || settings.storeEmail || settings.storeWhatsApp) && (
          <div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#2D8CFF'
            }}>
              Kontak
            </h3>
            {settings.storePhone && (
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#9CA3AF' }}>
                📞 {settings.storePhone}
              </p>
            )}
            {settings.storeEmail && (
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#9CA3AF' }}>
                ✉️ {settings.storeEmail}
              </p>
            )}
            {settings.storeWhatsApp && (
              <p style={{ margin: '0', fontSize: '14px', color: '#9CA3AF' }}>
                💬 {settings.storeWhatsApp}
              </p>
            )}
          </div>
        )}

        {/* Social Media */}
        {(settings.storeInstagram || settings.storeFacebook || settings.storeTwitter) && (
          <div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#2D8CFF'
            }}>
              Media Sosial
            </h3>
            {settings.storeInstagram && (
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#9CA3AF' }}>
                📷 Instagram: {settings.storeInstagram}
              </p>
            )}
            {settings.storeFacebook && (
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#9CA3AF' }}>
                📘 Facebook: {settings.storeFacebook}
              </p>
            )}
            {settings.storeTwitter && (
              <p style={{ margin: '0', fontSize: '14px', color: '#9CA3AF' }}>
                🐦 Twitter: {settings.storeTwitter}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{
        borderTop: '1px solid #374151',
        marginTop: '24px',
        paddingTop: '16px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#6B7280'
      }}>
        © {new Date().getFullYear()} {settings.storeName || 'POS System'}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
