// Authentication and Role-Based Access utilities for frontend

// Role hierarchy levels (higher = more permissions)
export const ROLE_LEVELS = {
  'Admin': 3,
  'Manager': 2,
  'Cashier': 1,
  'Viewer': 0
};

// Permission definitions
export const PERMISSIONS = {
  // Products
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  
  // Categories
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  
  // Invoices
  INVOICES_READ: 'invoices:read',
  INVOICES_CREATE: 'invoices:create',
  INVOICES_UPDATE: 'invoices:update',
  INVOICES_DELETE: 'invoices:delete',
  
  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  
  // Users
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  
  // Payment Methods
  PAYMENT_METHODS_READ: 'payment-methods:read',
  PAYMENT_METHODS_CREATE: 'payment-methods:create',
  PAYMENT_METHODS_UPDATE: 'payment-methods:update',
  PAYMENT_METHODS_DELETE: 'payment-methods:delete'
};

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  'Admin': [
    PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.CATEGORIES_READ, PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_DELETE,
    PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_CREATE, PERMISSIONS.INVOICES_UPDATE, PERMISSIONS.INVOICES_DELETE,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.PAYMENT_METHODS_READ, PERMISSIONS.PAYMENT_METHODS_CREATE, PERMISSIONS.PAYMENT_METHODS_UPDATE, PERMISSIONS.PAYMENT_METHODS_DELETE
  ],
  'Manager': [
    PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.CATEGORIES_READ, PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.PAYMENT_METHODS_READ
  ],
  'Cashier': [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.REPORTS_READ
  ],
  'Viewer': [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.REPORTS_READ
  ]
};

// Get current user role from localStorage
export const getUserRole = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Get user role level
export const getRoleLevel = (role) => {
  return ROLE_LEVELS[role] || 0;
};

// Check if user has specific permission
export const hasPermission = (permission) => {
  const role = getUserRole();
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

// Check if user has any of the permissions
export const hasAnyPermission = (permissions) => {
  return permissions.some(permission => hasPermission(permission));
};

// Check if user has all permissions
export const hasAllPermissions = (permissions) => {
  return permissions.every(permission => hasPermission(permission));
};

// Check if user has minimum role level
export const hasMinRole = (minRole) => {
  const role = getUserRole();
  if (!role) return false;
  
  const userLevel = ROLE_LEVELS[role] || 0;
  const requiredLevel = ROLE_LEVELS[minRole] || 0;
  
  return userLevel >= requiredLevel;
};

// Check if user is admin
export const isAdmin = () => {
  return getUserRole() === 'Admin';
};

// Check if user is manager or admin
export const isManager = () => {
  const role = getUserRole();
  return role === 'Admin' || role === 'Manager';
};

// Check if user is cashier or above
export const isCashier = () => {
  const role = getUserRole();
  return role === 'Admin' || role === 'Manager' || role === 'Cashier';
};

// Get all permissions for current user role
export const getUserPermissions = () => {
  const role = getUserRole();
  return ROLE_PERMISSIONS[role] || [];
};

// Helper to check if user can access certain route
export const canAccessRoute = (requiredRole) => {
  const role = getUserRole();
  if (!role) return false;
  
  const userLevel = ROLE_LEVELS[role] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

export default {
  getUserRole,
  getRoleLevel,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinRole,
  isAdmin,
  isManager,
  isCashier,
  getUserPermissions,
  canAccessRoute,
  ROLE_LEVELS,
  PERMISSIONS
};
