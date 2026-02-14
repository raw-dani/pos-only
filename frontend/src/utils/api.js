// API Configuration - Centralized API URL management
// Use environment variables in production

const getApiBaseUrl = () => {
  // Check if running in production (build)
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || '';
  }
  
  // Development - use local server
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  
  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  
  // Invoices
  INVOICES: `${API_BASE_URL}/api/invoices`,
  
  // Reports
  SALES_REPORT: `${API_BASE_URL}/api/reports/sales`,
  SALES_REPORT_PDF: `${API_BASE_URL}/api/reports/sales/pdf`,
  
  // Payment Methods
  PAYMENT_METHODS: `${API_BASE_URL}/api/payment-methods`,
  
  // Settings
  SETTINGS: `${API_BASE_URL}/api/settings`,
};

export default API_BASE_URL;
