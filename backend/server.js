// Temporary in-memory storage for demo
let products = [];
let categories = [
  { id: 1, name: 'Food & Beverage' },
  { id: 2, name: 'Electronics' },
  { id: 3, name: 'Clothing' },
  { id: 4, name: 'Others' }
];
let productIdCounter = 1;
let categoryIdCounter = 5;

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Simple login route for testing
app.post('/api/auth/login', async (req, res) => {
  console.log('DEBUG - Simple login called');
  try {
    const { username, password } = req.body;

    // Simple hardcoded check for testing
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign({ id: 1 }, 'test-secret-key', { expiresIn: '8h' });
      console.log('DEBUG - Generated token:', token);
      res.json({
        token,
        user: { id: 1, name: 'Admin', role: 'Admin' }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Categories routes
app.get('/api/categories', async (req, res) => {
  console.log('DEBUG - Get categories called');
  try {
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  console.log('DEBUG - Create category called with:', req.body);
  try {
    const category = {
      id: categoryIdCounter++,
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    categories.push(category);
    console.log('DEBUG - Created category:', category);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  console.log('DEBUG - Update category called for id:', req.params.id, 'with:', req.body);
  try {
    const categoryIndex = categories.findIndex(cat => cat.id === parseInt(req.params.id));
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      ...req.body,
      updatedAt: new Date()
    };
    console.log('DEBUG - Updated category:', categories[categoryIndex]);
    res.json(categories[categoryIndex]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  console.log('DEBUG - Delete category called for id:', req.params.id);
  try {
    const categoryIndex = categories.findIndex(cat => cat.id === parseInt(req.params.id));
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const deletedCategory = categories.splice(categoryIndex, 1)[0];
    console.log('DEBUG - Deleted category:', deletedCategory);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Products routes
app.get('/api/products', async (req, res) => {
  console.log('DEBUG - Get products called, returning:', products.length, 'products');
  try {
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  console.log('DEBUG - Create product called with:', req.body);
  console.log('DEBUG - Headers:', req.headers);

  try {
    const product = {
      id: productIdCounter++,
      ...req.body,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    products.push(product);
    console.log('DEBUG - Created product:', product);
    console.log('DEBUG - Total products now:', products.length);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  console.log('DEBUG - Update product called, id:', req.params.id);
  console.log('DEBUG - Update data:', req.body);
  try {
    const productIndex = products.findIndex(p => p.id == req.params.id);
    if (productIndex === -1) {
      console.log('DEBUG - Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }
    products[productIndex] = { ...products[productIndex], ...req.body, updatedAt: new Date() };
    console.log('DEBUG - Updated product:', products[productIndex]);
    res.json(products[productIndex]);
  } catch (error) {
    console.error('DEBUG - Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invoices routes
app.post('/api/invoices', async (req, res) => {
  console.log('DEBUG - Create invoice called with:', req.body);
  try {
    // Create invoice with pending status first
    const invoice = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date(),
      status: 'pending' // Start with pending status
    };

    console.log('DEBUG - Created invoice:', invoice);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment route
app.put('/api/invoices/:id/pay', (req, res) => {
  console.log('DEBUG - Confirm payment for invoice:', req.params.id);
  try {
    // In a real app, this would update the database
    // For demo, we'll just return success
    const invoice = {
      id: parseInt(req.params.id),
      ...req.body,
      status: 'paid',
      paidAt: new Date()
    };

    console.log('DEBUG - Payment confirmed for invoice:', invoice);
    res.json(invoice);
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reports routes
app.get('/api/reports/sales', (req, res) => {
  console.log('DEBUG - Get sales reports called with params:', req.query);
  try {
    // For demo purposes, return mock data
    // In a real app, this would query the database
    const mockReports = [
      {
        id: 1764718098549,
        createdAt: '2025-12-03T06:42:23.000Z',
        cashier: { name: 'Admin' },
        items: [
          { product: '1', name: 'Nasi Goreng', quantity: 2, price: 25000, total: 50000 },
          { product: '2', name: 'Es Teh', quantity: 1, price: 5000, total: 5000 }
        ],
        status: 'paid'
      },
      {
        id: 1764718000000,
        createdAt: '2025-12-03T05:30:00.000Z',
        cashier: { name: 'Admin' },
        items: [
          { product: '3', name: 'Ayam Bakar', quantity: 1, price: 35000, total: 35000 }
        ],
        status: 'paid'
      }
    ];

    // Filter by date range if provided
    let filteredReports = mockReports;
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day

      filteredReports = mockReports.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate >= startDate && reportDate <= endDate;
      });
    }

    // Filter by cashier if provided
    if (req.query.cashier) {
      filteredReports = filteredReports.filter(report =>
        report.cashier.name.toLowerCase().includes(req.query.cashier.toLowerCase())
      );
    }

    const totalSales = filteredReports.reduce((sum, report) =>
      sum + report.items.reduce((itemSum, item) => itemSum + item.total, 0), 0
    );

    console.log('DEBUG - Returning reports:', filteredReports.length, 'reports, total sales:', totalSales);
    res.json({
      invoices: filteredReports,
      totalSales: totalSales
    });
  } catch (error) {
    console.error('Get sales reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/sales/pdf', (req, res) => {
  console.log('DEBUG - Export sales PDF called with params:', req.query);
  try {
    // For demo, return a simple PDF
    const PDFDocument = require('pdfkit');

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

    doc.pipe(res);
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.text('This is a demo PDF report.');
    doc.end();

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));