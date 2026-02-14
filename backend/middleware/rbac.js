/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides role-based authorization for routes
 */

// Define role hierarchy (higher number = more permissions)
const ROLE_LEVELS = {
  'Admin': 3,
  'Cashier': 2,
  'Manager': 2,
  'Viewer': 1
};

// Define permissions for each role
const ROLE_PERMISSIONS = {
  'Admin': [
    'products:read', 'products:create', 'products:update', 'products:delete',
    'categories:read', 'categories:create', 'categories:update', 'categories:delete',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete',
    'reports:read', 'reports:export',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'settings:read', 'settings:update',
    'payment-methods:read', 'payment-methods:create', 'payment-methods:update', 'payment-methods:delete'
  ],
  'Manager': [
    'products:read', 'products:create', 'products:update',
    'categories:read', 'categories:create', 'categories:update',
    'invoices:read', 'invoices:create',
    'reports:read', 'reports:export',
    'payment-methods:read'
  ],
  'Cashier': [
    'products:read',
    'categories:read',
    'invoices:read', 'invoices:create',
    'reports:read'
  ],
  'Viewer': [
    'products:read',
    'categories:read',
    'invoices:read',
    'reports:read'
  ]
};

/**
 * Check if user has required role level
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role?.name;
    
    if (!userRole) {
      return res.status(403).json({ error: 'No role assigned' });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      console.log(`RBAC - Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Check if user has required permission
 * @param {string[]} requiredPermissions - Array of required permissions
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role?.name;
    
    if (!userRole) {
      return res.status(403).json({ error: 'No role assigned' });
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    // Check if user has all required permissions
    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      console.log(`RBAC - Permission denied. User role: ${userRole}, Required: ${requiredPermissions.join(', ')}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Check if user has minimum role level
 * @param {string} minRole - Minimum required role
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role?.name;
    
    if (!userRole) {
      return res.status(403).json({ error: 'No role assigned' });
    }

    const userLevel = ROLE_LEVELS[userRole] || 0;
    const requiredLevel = ROLE_LEVELS[minRole] || 0;

    if (userLevel < requiredLevel) {
      console.log(`RBAC - Access denied. User level: ${userLevel}, Required: ${requiredLevel}`);
      return res.status(403).json({ error: 'Insufficient role level' });
    }

    next();
  };
};

/**
 * Helper function to get user's permissions
 */
const getUserPermissions = (roleName) => {
  return ROLE_PERMISSIONS[roleName] || [];
};

/**
 * Helper function to check specific permission
 */
const hasPermission = (roleName, permission) => {
  const permissions = ROLE_PERMISSIONS[roleName] || [];
  return permissions.includes(permission);
};

module.exports = {
  requireRole,
  requirePermission,
  requireMinRole,
  getUserPermissions,
  hasPermission,
  ROLE_LEVELS,
  ROLE_PERMISSIONS
};
