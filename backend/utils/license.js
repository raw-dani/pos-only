/**
 * License Utility - Handle license encryption/decryption
 * 
 * License file: .license.enc (encrypted JSON)
 * Structure: { mode: "online"|"offline", domain: "domain.com", active: true|false, createdAt: "..." }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LICENSE_FILE = path.join(__dirname, '..', '.license.enc');
const ENCRYPTION_KEY = process.env.LICENSE_KEY || 'default_license_key_change_me';

// Hidden activation password - embedded in code (customer cannot see)
const ACTIVATION_PASSWORD = 'POS_ACTIVATION_KEY_2024';

/**
 * Get encryption key (must be 32 bytes for AES-256)
 */
const getKey = () => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

/**
 * Encrypt data
 */
const encrypt = (data) => {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt data
 */
const decrypt = (encryptedData) => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = getKey();
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

/**
 * Read license from file
 */
const getLicense = () => {
  try {
    if (!fs.existsSync(LICENSE_FILE)) {
      return null;
    }
    const encrypted = fs.readFileSync(LICENSE_FILE, 'utf8');
    return decrypt(encrypted);
  } catch (error) {
    console.error('Error reading license:', error.message);
    return null;
  }
};

/**
 * Save license to file
 */
const saveLicense = (licenseData) => {
  try {
    const encrypted = encrypt(licenseData);
    fs.writeFileSync(LICENSE_FILE, encrypted, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving license:', error.message);
    return false;
  }
};

/**
 * Set license mode (online/offline)
 */
const setMode = (mode) => {
  const license = getLicense() || { mode: 'offline', domain: '', active: false, createdAt: new Date().toISOString() };
  license.mode = mode;
  // Clear domain when switching to offline mode
  if (mode === 'offline') {
    license.domain = '';
  }
  license.updatedAt = new Date().toISOString();
  return saveLicense(license);
};

/**
 * Set license domain
 */
const setDomain = (domain) => {
  const license = getLicense() || { mode: 'offline', domain: '', active: false, createdAt: new Date().toISOString() };
  // Extract base domain (remove subdomain)
  const domainParts = domain.replace(/^https?:\/\//, '').split('.');
  if (domainParts.length >= 2) {
    // Get last 2 parts for main domain
    license.domain = domainParts.slice(-2).join('.');
  } else {
    license.domain = domain;
  }
  license.updatedAt = new Date().toISOString();
  return saveLicense(license);
};

/**
 * Set license active status
 * @param {boolean} active - Active status
 * @param {string} password - Activation password
 * @returns {object} - { success: boolean, message: string }
 */
const setActive = (active, password) => {
  // Verify password
  if (active && password !== ACTIVATION_PASSWORD) {
    return { success: false, message: 'Invalid activation password' };
  }
  
  const license = getLicense() || { mode: 'offline', domain: '', active: false, createdAt: new Date().toISOString() };
  license.active = active;
  license.activatedAt = active ? new Date().toISOString() : null;
  license.updatedAt = new Date().toISOString();
  const result = saveLicense(license);
  return { success: result, message: result ? 'License activated' : 'Failed to save license' };
};

/**
 * Revoke license (reset)
 * @param {string} password - Revoke password
 * @returns {object} - { success: boolean, message: string }
 */
const revoke = (password) => {
  // Verify password
  if (password !== ACTIVATION_PASSWORD) {
    return { success: false, message: 'Invalid revoke password' };
  }
  
  const license = getLicense() || { mode: 'offline', domain: '', active: false, createdAt: new Date().toISOString() };
  license.active = false;
  license.revokedAt = new Date().toISOString();
  license.updatedAt = new Date().toISOString();
  const result = saveLicense(license);
  return { success: result, message: result ? 'License revoked' : 'Failed to revoke license' };
};

/**
 * Check if license is valid for current domain
 */
const isValidLicense = (requestDomain) => {
  const license = getLicense();
  
  // No license file = invalid
  if (!license) {
    return { valid: false, reason: 'No license found' };
  }
  
  // License not active = invalid
  if (!license.active) {
    return { valid: false, reason: 'License not active' };
  }
  
  // Offline mode - allow localhost only
  if (license.mode === 'offline') {
    const isLocalhost = !requestDomain || 
      requestDomain.includes('localhost') || 
      requestDomain === '127.0.0.1' ||
      requestDomain === '::1';
    
    if (!isLocalhost) {
      return { valid: false, reason: 'Offline mode - server access not allowed' };
    }
    return { valid: true, mode: 'offline' };
  }
  
  // Online mode - check domain
  if (license.mode === 'online') {
    if (!license.domain) {
      return { valid: false, reason: 'No domain configured for online mode' };
    }
    
    // Extract request domain (remove subdomain)
    const requestDomainClean = requestDomain.replace(/^https?:\/\//, '').split('.');
    const requestBaseDomain = requestDomainClean.slice(-2).join('.');
    
    // Check if domains match (allow subdomains)
    if (requestBaseDomain === license.domain || requestDomain.includes(license.domain)) {
      return { valid: true, mode: 'online', domain: license.domain };
    }
    
    return { valid: false, reason: `Domain mismatch. Expected: ${license.domain}` };
  }
  
  return { valid: false, reason: 'Invalid license mode' };
};

/**
 * Get license info (without sensitive data)
 */
const getLicenseInfo = () => {
  const license = getLicense();
  if (!license) {
    return { configured: false, mode: null, active: false };
  }
  
  return {
    configured: true,
    mode: license.mode,
    domain: license.domain || null,
    active: license.active,
    createdAt: license.createdAt,
    activatedAt: license.activatedAt,
    revokedAt: license.revokedAt,
    updatedAt: license.updatedAt
  };
};

module.exports = {
  getLicense,
  saveLicense,
  setMode,
  setDomain,
  setActive,
  revoke,
  isValidLicense,
  getLicenseInfo
};
