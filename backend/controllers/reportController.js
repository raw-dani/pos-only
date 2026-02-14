const { Invoice } = require('../models/Invoice');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, cashier } = req.query;
    let where = { status: 'paid' };
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (cashier) {
      where.cashierId = cashier;
    }
    const invoices = await Invoice.findAll({
      where,
      include: [{ model: require('../models/User'), as: 'cashier' }]
    });
    const totalSales = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    res.json({ invoices, totalSales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportSalesReportPDF = async (req, res) => {
  try {
    const { startDate, endDate, cashier } = req.query;
    let where = { status: 'paid' };
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (cashier) {
      where.cashierId = cashier;
    }
    const invoices = await Invoice.findAll({
      where,
      include: [{ model: require('../models/User'), as: 'cashier' }]
    });
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
    doc.pipe(res);
    doc.fontSize(20).text('Laporan Penjualan', { align: 'center' });
    doc.moveDown();
    invoices.forEach(inv => {
      doc.fontSize(12).text(`Invoice: ${inv.invoiceNumber}, Total: ${inv.total}`);
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};