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

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize database and sync models
const initDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('All models synchronized with database.');
    
    // Check if we need to seed initial data
    const roleCount = await Role.count();
    if (roleCount === 0) {
      console.log('Seeding initial data...');
      await seedInitialData();
    }
  } catch (error) {
    console.error('Unable to connect to database:', error);
    // Continue anyway for development - will use in-memory fallback
  }
};

// Seed initial data
const seedInitialData = async () => {
  try {
    // Create roles
    const roles = await Role.bulkCreate([
      { name: 'Admin' },
      { name: 'Cashier' }
    ]);
    
    // Create admin user with hashed password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      email: 'admin@pos.com',
      roleId: roles[0].id,
      isActive: true
    });
    
    // Create cashier user
    await User.create({
      username: 'kasir',
      password: await bcrypt.hash('kasir123', 10),
      name: 'Kasir',
      email: 'kasir@pos.com',
      roleId: roles[1].id,
      isActive: true
    });
    
    // Create categories
    const categories = await Category.bulkCreate([
      { name: 'Food & Beverage', description: 'Food and drinks items' },
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Others', description: 'Miscellaneous items' }
    ]);
    
    // Create sample products
    await Product.bulkCreate([
      { name: 'Nasi Goreng', categoryId: categories[0].id, price: 25000, description: 'Fried rice with egg', isActive: true },
      { name: 'Mie Goreng', categoryId: categories[0].id, price: 20000, description: 'Fried noodles', isActive: true },
      { name: 'Es Teh', categoryId: categories[0].id, price: 5000, description: 'Iced tea', isActive: true },
      { name: 'Ayam Bakar', categoryId: categories[0].id, price: 35000, description: 'Grilled chicken', isActive: true }
    ]);
    
    // Create payment methods
    await PaymentMethod.bulkCreate([
      { name: 'Cash', type: 'cash' },
      { name: 'Debit Card', type: 'transfer' },
      { name: 'Credit Card', type: 'transfer' },
      { name: 'E-Wallet', type: 'qris' }
    ]);
    
    console.log('Initial data seeded successfully!');
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

// Login route with database authentication
app.post('/api/auth/login', async (req, res) => {
  console.log('DEBUG - Login called');
  try {
    const { username, password } = req.body;

    // Find user in database
    const user = await User.findOne({ 
      where: { username, isActive: true },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role?.name },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '8h' }
    );

    console.log('DEBUG - Generated token for user:', user.username);
    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role?.name 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Categories routes
app.get('/api/categories', async (req, res) => {
  console.log('DEBUG - Get categories called');
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  console.log('DEBUG - Create category called with:', req.body);
  try {
    const category = await Category.create(req.body);
    console.log('DEBUG - Created category:', category);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  console.log('DEBUG - Update category called for id:', req.params.id);
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await category.update(req.body);
    console.log('DEBUG - Updated category:', category);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  console.log('DEBUG - Delete category called for id:', req.params.id);
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await category.destroy();
    console.log('DEBUG - Deleted category:', req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Products routes
app.get('/api/products', async (req, res) => {
  console.log('DEBUG - Get products called');
  try {
    const products = await Product.findAll({ 
      include: [{ model: Category, as: 'category' }],
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    console.log('DEBUG - Returning:', products.length, 'products');
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  console.log('DEBUG - Create product called with:', req.body);
  try {
    const product = await Product.create({
      ...req.body,
      isActive: true
    });
    console.log('DEBUG - Created product:', product.id);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  console.log('DEBUG - Update product called for id:', req.params.id);
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    await product.update(req.body);
    console.log('DEBUG - Updated product:', product.id);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  console.log('DEBUG - Delete product called for id:', req.params.id);
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Soft delete - just set isActive to false
    await product.update({ isActive: false });
    console.log('DEBUG - Deleted (deactivated) product:', req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invoices routes
app.post('/api/invoices', async (req, res) => {
  console.log('DEBUG - Create invoice called with:', req.body);
  try {
    const { items, cashierId, subtotal, discount = 0, tax = 0, total, paymentMethodId, paymentAmount } = req.body;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      cashierId,
      subtotal,
      discount,
      tax,
      total,
      status: 'draft'
    });

    // Create invoice items
    if (items && items.length > 0) {
      const invoiceItems = items.map(item => ({
        invoiceId: invoice.id,
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }));
      await InvoiceItem.bulkCreate(invoiceItems);
    }

    // Process payment if provided
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

    console.log('DEBUG - Created invoice:', invoiceNumber);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices
app.get('/api/invoices', async (req, res) => {
  console.log('DEBUG - Get invoices called');
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
    console.error('Get invoices error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment route
app.put('/api/invoices/:id/pay', async (req, res) => {
  console.log('DEBUG - Confirm payment for invoice:', req.params.id);
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const { paymentMethodId, amount } = req.body;
    const change = amount - invoice.total;

    // Create payment record
    await Payment.create({
      invoiceId: invoice.id,
      methodId: paymentMethodId,
      amount: amount,
      change: Math.max(0, change)
    });

    // Update invoice status
    await invoice.update({ status: 'paid' });

    console.log('DEBUG - Payment confirmed for invoice:', invoice.invoiceNumber);
    res.json(invoice);
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reports routes
app.get('/api/reports/sales', async (req, res) => {
  console.log('DEBUG - Get sales reports called with params:', req.query);
  try {
    const { startDate, endDate, cashierId } = req.query;

    // Build where clause
    const whereClause = { status: 'paid' };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate)
        ]
      };
    }

    if (cashierId) {
      whereClause.cashierId = cashierId;
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const totalSales = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    console.log('DEBUG - Returning reports:', invoices.length, 'invoices, total sales:', totalSales);
    res.json({
      invoices,
      totalSales
    });
  } catch (error) {
    console.error('Get sales reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/sales/pdf', async (req, res) => {
  console.log('DEBUG - Export sales PDF called with params:', req.query);
  try {
    const PDFDocument = require('pdfkit');
    const { startDate, endDate } = req.query;

    // Get sales data
    const whereClause = { status: 'paid' };
    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate)
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

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

    doc.pipe(res);
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
    if (startDate && endDate) {
      doc.text(`Period: ${startDate} to ${endDate}`);
    }
    doc.moveDown();

    // Add invoice details
    let totalSales = 0;
    invoices.forEach((invoice, index) => {
      doc.fontSize(12).text(`Invoice #${invoice.invoiceNumber} - ${invoice.cashier?.name || 'N/A'} - Rp ${parseFloat(invoice.total).toLocaleString('id-ID')}`, { continued: false });
      totalSales += parseFloat(invoice.total);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Sales: Rp ${totalSales.toLocaleString('id-ID')}`, { bold: true });
    doc.end();

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment methods routes
app.get('/api/payment-methods', async (req, res) => {
  try {
    const methods = await PaymentMethod.findAll();
    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server working with database' });
});

// Start server
const PORT = process.env.PORT || 5000;

// Initialize database first, then start server
initDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
