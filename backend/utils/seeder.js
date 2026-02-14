const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const seedData = async () => {
  try {
    // Seed roles
    const [adminRoleResult] = await sequelize.query(
      "INSERT IGNORE INTO Roles (name, permissions, createdAt, updatedAt) VALUES ('Admin', '[\"all\"]', NOW(), NOW())"
    );

    const [cashierRoleResult] = await sequelize.query(
      "INSERT IGNORE INTO Roles (name, permissions, createdAt, updatedAt) VALUES ('Kasir', '[\"pos\",\"invoice\"]', NOW(), NOW())"
    );

    // Get role IDs
    const [adminRoleRows] = await sequelize.query("SELECT id FROM Roles WHERE name = 'Admin'");
    const [cashierRoleRows] = await sequelize.query("SELECT id FROM Roles WHERE name = 'Kasir'");

    if (adminRoleRows.length === 0) {
      console.error('Admin role not found');
      return;
    }

    const adminRoleId = adminRoleRows[0].id;

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await sequelize.query(
      `INSERT IGNORE INTO Users (username, password, roleId, name, email, isActive, createdAt, updatedAt)
       VALUES ('admin', '${hashedPassword}', ${adminRoleId}, 'Administrator', 'admin@example.com', 1, NOW(), NOW())`
    );

    // Seed payment methods
    const paymentMethods = [
      { name: 'Cash', type: 'cash' },
      { name: 'Transfer Bank', type: 'transfer' },
      { name: 'QRIS', type: 'qris' }
    ];

    for (const pm of paymentMethods) {
      await sequelize.query(
        `INSERT IGNORE INTO PaymentMethods (name, type, isActive, createdAt, updatedAt)
         VALUES ('${pm.name}', '${pm.type}', 1, NOW(), NOW())`
      );
    }

    // Seed settings
    await sequelize.query(
      `INSERT IGNORE INTO Settings (storeName, taxRate, currency, createdAt, updatedAt)
       VALUES ('Toko POS', 10, 'IDR', NOW(), NOW())`
    );

    console.log('Data seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedData;