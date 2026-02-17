const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Toko Saya'
  },
  storeAddress: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  storePhone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  storeEmail: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  storeWhatsApp: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  storeInstagram: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  storeFacebook: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  storeTwitter: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  taxEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  invoiceTemplate: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = Setting;