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
    allowNull: false
  },
  storeAddress: {
    type: DataTypes.TEXT
  },
  storePhone: {
    type: DataTypes.STRING
  },
  storeEmail: {
    type: DataTypes.STRING
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'IDR'
  },
  invoiceTemplate: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = Setting;