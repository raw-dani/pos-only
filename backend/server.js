const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import database config and models
const sequelize = require('./config/database');
const Category = require('./models/Category');
const Product = require('./models/Product');
const { Invoice, InvoiceItem, Payment } = require('./models/Invoice');
const User = require('./models/User');
const Role = require('./models/Role');
const PaymentMethod = require('./models/PaymentMethod');
const Setting = require('./models/Setting');

// Import middleware
const auth = require('./middleware/auth');
const rbac = require('./middleware/rbac');
const validation = require('./utils/validation');
const production = require('./middleware/production');
const license = require('./utils/license');

const isDev = process.env.NODE_ENV === 'development';

// Helper: safe error message (don't leak DB details in production)
const safeError = (error, fallback = 'Internal server error') => {
  return isDev ? error.message : fallback;
};

const app = express();

// ========================================
// LICENSE CHECK
// ========================================
const checkLicense = () => {
  return (req, res, next) => {
    const host = req.get('host') || req.headers.origin;
    const licenseCheck = license.isValidLicense(host);
    if (!licenseCheck.valid) {
      console.error('LICENSE ERROR:', licenseCheck.reason);
      return res.status(403).json({
        error: 'License Validation Failed',
        message: licenseCheck.reason
      });
    }
    req.licenseInfo = licenseCheck;
    next();
  };
};

app.use(checkLicense());

// Apply production middleware
app.use(production.securityHeaders);
app.use(production.generalLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      process.env.CORS_ORIGIN,
      process.env.PRODUCTION_URL
    ].filter(Boolean);

    if (isDev) {
      callback(null, true);
      return;
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========================================
// DATABASE INIT
// ========================================
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    if (isDev) {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    }
    console.log('Database models synchronized.');

    const roleCount = await Role.count();
    if (roleCount === 0) {
      await seedInitialData();
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
};

// Seed initial data
const seedInitialData = async () => {
  try {
    const roles = await Role.bulkCreate([
      { name: 'Admin' },
      { name: 'Manager' },
      { name: 'Cashier' }
    ]);

    // Use strong default passwords - buyer MUST change after first login
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345!';
    await User.create({
      username: 'admin',
      password: await bcrypt.hash(defaultAdminPassword, 10),
      name: 'Administrator',
      email: 'admin@pos.com',
      roleId: roles[0].id,
      isActive: true
    });

    await User.create({
      username: 'kasir',
      password: await bcrypt.hash('Kasir@12345!', 10),
      name: 'Kasir',
      email: 'kasir@pos.com',
      roleId: roles[2].id,
      isActive: true
    });

    await User.create({
      username: 'manager',
      password: await bcrypt.hash('Manager@12345!', 10),
      name: 'Manager',
      email: 'manager@pos.com',
      roleId: roles[1].id,
      isActive: true
    });

    const categories = await Category.bulkCreate([
      { name: 'Food & Beverage', description: 'Food and drinks items' },
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Others', description: 'Miscellaneous items' }
    ]);

    await Product.bulkCreate([
      { name: 'Nasi Goreng', categoryId: categories[0].id, price: 25000, description: 'Fried rice with egg', isActive: true },
      { name: 'Mie Goreng', categoryId: categories[0].id, price: 20000, description: 'Fried noodles', isActive: true },
      { name: 'Es Teh', categoryId: categories[0].id, price: 5000, description: 'Iced tea', isActive: true },
      { name: 'Ayam Bakar', categoryId: categories[0].id, price: 35000, description: 'Grilled chicken', isActive: true }
    ]);

    await PaymentMethod.bulkCreate([
      { name: 'Cash', type: 'cash' },
      { name: 'Debit Card', type: 'transfer' },
      { name: 'Credit Card', type: 'transfer' },
      { name: 'E-Wallet', type: 'qris' }
    ]);

    console.log('Initial data seeded successfully!');
    console.log('⚠️  Default passwords set - please change them after first login!');
    console.log('   admin / Admin@12345!');
    console.log('   kasir / Kasir@12345!');
    console.log('   manager / Manager@12345!');
  } catch (error) {
    console.error('Error seeding initial data:', error.message);
  }
};

// ========================================
// AUTH ROUTES
// ========================================
app.post('/api/auth/login', production.loginLimiter, validation.validate(validation.loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username, isActive: true },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userRole = user.role ? user.role.name : 'Unknown';
    const token = jwt.sign(
      { id: user.id, role: userRole },
      process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not set'); })(),
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: safeError(error, 'Login failed') });
  }
});

// ========================================
// CATEGORIES ROUTES
// ========================================
app.get('/api/categories', auth, rbac.requirePermission('categories:read'), async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.post('/api/categories', auth, rbac.requirePermission('categories:create'), validation.validate(validation.categorySchema), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.put('/api/categories/:id', auth, rbac.requirePermission('categories:update'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.update(req.body);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.delete('/api/categories/:id', auth, rbac.requirePermission('categories:delete'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// PRODUCTS ROUTES
// ========================================
app.get('/api/products', auth, rbac.requirePermission('products:read'), async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, as: 'category' }],
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.post('/api/products', auth, rbac.requirePermission('products:create'), validation.validate(validation.productSchema), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, isActive: true });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.put('/api/products/:id', auth, rbac.requirePermission('products:update'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update(req.body);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.delete('/api/products/:id', auth, rbac.requirePermission('products:delete'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update({ isActive: false }); // Soft delete
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// INVOICES ROUTES
// ========================================
app.post('/api/invoices', auth, rbac.requirePermission('invoices:create'), validation.validate(validation.invoiceSchema), async (req, res) => {
  try {
    const { items, cashierId, discount = 0, paymentMethodId, paymentAmount } = req.body;

    const settings = await Setting.findOne();
    const taxEnabled = settings?.taxEnabled || false;
    const taxRate = parseFloat(settings?.taxRate) || 0;

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const taxAmount = taxEnabled && taxRate > 0 ? subtotal * taxRate / 100 : 0;
    const total = subtotal + taxAmount;

    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await Invoice.create({
      invoiceNumber,
      cashierId: cashierId || req.user.id,
      subtotal,
      discount,
      tax: taxAmount,
      total,
      status: 'draft'
    });

    if (items && items.length > 0) {
      const invoiceItems = items.map(item => ({
        invoiceId: invoice.id,
        productId: item.productId || item.product,
        quantity: item.quantity,
        price: item.price,
        total: item.total || (item.quantity * item.price)
      }));
      await InvoiceItem.bulkCreate(invoiceItems);
    }

    if (paymentMethodId && paymentAmount) {
      const change = paymentAmount - total;
      await Payment.create({
        invoiceId: invoice.id,
        methodId: paymentMethodId,
        amount: paymentAmount,
        change: Math.max(0, change)
      });
      await invoice.update({ status: 'paid' });
    }

    const completeInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.status(201).json(completeInvoice);
  } catch (error) {
    console.error('Create invoice error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.get('/api/invoices', auth, rbac.requirePermission('invoices:read'), async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Payment, as: 'payments', include: [{ model: PaymentMethod, as: 'method' }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.put('/api/invoices/:id/pay', auth, rbac.requirePermission('invoices:update'), validation.validate(validation.paymentSchema), async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { paymentMethodId, amount } = req.body;
    const change = amount - invoice.total;

    await Payment.create({
      invoiceId: invoice.id,
      methodId: paymentMethodId,
      amount: amount,
      change: Math.max(0, change)
    });
    await invoice.update({ status: 'paid' });

    const completeInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json(completeInvoice);
  } catch (error) {
    console.error('Confirm payment error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// REPORTS ROUTES
// ========================================
app.get('/api/reports/sales', auth, rbac.requirePermission('reports:read'), async (req, res) => {
  try {
    const { startDate, endDate, cashier, cashierId } = req.query;
    const whereClause = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate + 'T23:59:59')
        ]
      };
    }

    if (cashierId) whereClause.cashierId = cashierId;

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    let filteredInvoices = invoices;
    if (cashier) {
      filteredInvoices = invoices.filter(inv =>
        inv.cashier && inv.cashier.name.toLowerCase().includes(cashier.toLowerCase())
      );
    }

    const totalSales = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    res.json({ invoices: filteredInvoices, totalSales });
  } catch (error) {
    console.error('Get sales reports error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.get('/api/reports/sales/pdf', auth, rbac.requirePermission('reports:export'), async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { startDate, endDate } = req.query;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate + 'T23:59:59')
        ]
      };
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'cashier', attributes: ['name'] },
        { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const settings = await Setting.findOne();
    const storeName = settings?.storeName || 'Toko Saya';
    const storeAddress = settings?.storeAddress || '';
    const storePhone = settings?.storePhone || '';

    let totalSales = 0, totalTax = 0, totalItems = 0;
    invoices.forEach(invoice => {
      totalSales += parseFloat(invoice.subtotal || 0);
      totalTax += parseFloat(invoice.tax || 0);
      totalItems += invoice.items?.length || 0;
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
    doc.pipe(res);

    doc.fontSize(22).fillColor('#2D8CFF').text(storeName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666');
    if (storeAddress) doc.text(storeAddress, { align: 'center' });
    if (storePhone) doc.text(`Telp: ${storePhone}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(16).fillColor('#1F2937').text('LAPORAN PENJUALAN', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666');
    if (startDate && endDate) {
      doc.text(`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} s/d ${new Date(endDate).toLocaleDateString('id-ID')}`, { align: 'center' });
    } else {
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, { align: 'center' });
    }
    doc.moveDown();

    const boxY = doc.y;
    doc.rect(50, boxY, 150, 50).fillAndStroke('#2D8CFF', '#2D8CFF');
    doc.fillColor('#FFFFFF').fontSize(10).text('Ringkasan', 55, boxY + 8);
    doc.fontSize(9).text(`Transaksi: ${invoices.length}`, 55, boxY + 22);
    doc.text(`Item: ${totalItems}`, 55, boxY + 34);
    doc.rect(200, boxY, 350, 50).fillAndStroke('#F3F4F6', '#E5E7EB');
    doc.fillColor('#1F2937').fontSize(14).text(`Total Penjualan: Rp ${(totalSales + totalTax).toLocaleString('id-ID')}`, 210, boxY + 8);
    if (totalTax > 0) {
      doc.fontSize(10).fillColor('#EF4444').text(`(Termasuk Pajak: Rp ${totalTax.toLocaleString('id-ID')})`, 210, boxY + 26);
    }
    doc.moveDown(8);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 22).fill('#2D8CFF');
    doc.fillColor('#FFFFFF').fontSize(9);
    doc.text('No.', 52, tableTop + 6);
    doc.text('Invoice', 75, tableTop + 6);
    doc.text('Kasir', 160, tableTop + 6);
    doc.text('Tgl', 230, tableTop + 6);
    doc.text('Subtotal', 350, tableTop + 6, { width: 70, align: 'right' });
    doc.text('Pajak', 420, tableTop + 6, { width: 55, align: 'right' });
    doc.text('Total', 475, tableTop + 6, { width: 75, align: 'right' });

    let rowY = tableTop + 22;
    doc.fillColor('#1F2937').fontSize(8);
    invoices.forEach((invoice, index) => {
      if (index % 2 === 0) doc.rect(50, rowY, 500, 16).fill('#F9FAFB');
      doc.fillColor('#1F2937');
      doc.text(String(index + 1), 52, rowY + 4);
      doc.text(invoice.invoiceNumber || `#${invoice.id}`, 75, rowY + 4);
      doc.text(invoice.cashier?.name || 'Kasir', 160, rowY + 4);
      doc.text(new Date(invoice.createdAt).toLocaleDateString('id-ID'), 230, rowY + 4);
      doc.text(`Rp ${parseFloat(invoice.subtotal || 0).toLocaleString('id-ID')}`, 350, rowY + 4, { width: 70, align: 'right' });
      doc.text(invoice.tax > 0 ? `Rp ${parseFloat(invoice.tax || 0).toLocaleString('id-ID')}` : '-', 420, rowY + 4, { width: 55, align: 'right' });
      doc.text(`Rp ${parseFloat(invoice.total || 0).toLocaleString('id-ID')}`, 475, rowY + 4, { width: 75, align: 'right' });
      rowY += 16;
      if (rowY > 700) { doc.addPage(); rowY = 50; }
    });

    rowY += 3;
    doc.rect(50, rowY, 500, 20).fill('#2D8CFF');
    doc.fillColor('#FFFFFF').fontSize(9);
    doc.text('TOTAL', 230, rowY + 5);
    doc.text(`Rp ${totalSales.toLocaleString('id-ID')}`, 350, rowY + 5, { width: 70, align: 'right' });
    doc.text(`Rp ${totalTax.toLocaleString('id-ID')}`, 420, rowY + 5, { width: 55, align: 'right' });
    doc.text(`Rp ${(totalSales + totalTax).toLocaleString('id-ID')}`, 475, rowY + 5, { width: 75, align: 'right' });
    doc.moveDown(3);
    doc.fontSize(8).fillColor('#999999').text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} - ${storeName}`, { align: 'center' });
    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// PAYMENT METHODS ROUTES
// ========================================
app.get('/api/payment-methods', auth, rbac.requirePermission('payment-methods:read'), async (req, res) => {
  try {
    const methods = await PaymentMethod.findAll();
    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// USERS ROUTES
// ========================================
app.get('/api/users', auth, rbac.requirePermission('users:read'), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.post('/api/users', auth, rbac.requirePermission('users:create'), async (req, res) => {
  try {
    const { username, password, roleId, name, email } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, roleId, name, email, isActive: true });

    const createdUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.put('/api/users/:id', auth, rbac.requirePermission('users:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await user.update(updates);

    const updatedUser = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.delete('/api/users/:id', auth, rbac.requirePermission('users:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// ROLES ROUTE
// ========================================
app.get('/api/roles', auth, rbac.requirePermission('users:read'), async (req, res) => {
  try {
    // Remove duplicate "Kasir" role if exists
    const kasirRole = await Role.findOne({ where: { name: 'Kasir' } });
    if (kasirRole) {
      const cashierRole = await Role.findOne({ where: { name: 'Cashier' } });
      if (cashierRole) {
        await User.update({ roleId: cashierRole.id }, { where: { roleId: kasirRole.id } });
      }
      await kasirRole.destroy();
    }

    // Ensure required roles exist
    const requiredRoles = ['Admin', 'Manager', 'Cashier'];
    for (const roleName of requiredRoles) {
      const existing = await Role.findOne({ where: { name: roleName } });
      if (!existing) await Role.create({ name: roleName });
    }

    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// SETTINGS ROUTES
// ========================================
app.get('/api/settings', auth, rbac.requirePermission('settings:read'), async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        storeName: 'Toko Saya',
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
    }
    res.json(setting);
  } catch (error) {
    console.error('Get settings error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

app.put('/api/settings', auth, rbac.requirePermission('settings:update'), async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(req.body);
    } else {
      await setting.update(req.body);
      setting = await Setting.findOne();
    }
    res.json(setting);
  } catch (error) {
    console.error('Update settings error:', error.message);
    res.status(500).json({ error: safeError(error) });
  }
});

// ========================================
// HEALTH CHECK (production safe)
// ========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
});
