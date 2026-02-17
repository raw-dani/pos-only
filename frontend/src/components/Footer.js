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

  // Build info string
  const infoParts = [];
  if (settings.storeAddress) infoParts.push(`📍 ${settings.storeAddress}`);
  if (settings.storePhone) infoParts.push(`📞 ${settings.storePhone}`);
  if (settings.storeWhatsApp) infoParts.push(`💬 ${settings.storeWhatsApp}`);
  if (settings.storeEmail) infoParts.push(`✉️ ${settings.storeEmail}`);

  const socialParts = [];
  if (settings.storeInstagram) socialParts.push(`📷 ${settings.storeInstagram}`);
  if (settings.storeFacebook) socialParts.push(`📘 ${settings.storeFacebook}`);
  if (settings.storeTwitter) socialParts.push(`🐦 ${settings.storeTwitter}`);

  return (
    <footer style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#F9FAFB',
      borderTop: '1px solid #E5E7EB',
      padding: '8px 24px',
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        fontSize: '11px',
        color: '#6B7280'
      }}>
        {settings.storeName && (
          <span style={{ fontWeight: '500', color: '#374151' }}>
            {settings.storeName}
          </span>
        )}
        
        {infoParts.length > 0 && (
          <span style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {infoParts.map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </span>
        )}

        {socialParts.length > 0 && (
          <span style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {socialParts.map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </span>
        )}
      </div>
    </footer>
  );
};

export default Footer;
