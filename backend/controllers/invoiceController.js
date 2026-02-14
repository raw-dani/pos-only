const { Invoice, InvoiceItem, Payment } = require('../models/Invoice');
const Setting = require('../models/Setting');

exports.createInvoice = async (req, res) => {
  try {
    const { items, discount = 0 } = req.body;
    const cashierId = req.user.id;

    // Get tax rate from settings
    const setting = await Setting.findOne();
    const taxRate = setting ? setting.taxRate / 100 : 0;

    let subtotal = 0;
    const invoiceItems = items.map(item => {
      const total = item.quantity * item.price;
      subtotal += total;
      return {
        productId: item.product,
        quantity: item.quantity,
        price: item.price,
        total
      };
    });

    const tax = subtotal * taxRate;
    const total = subtotal - discount + tax;

    const invoiceNumber = 'INV-' + Date.now();

    const invoice = await Invoice.create({
      invoiceNumber,
      cashierId,
      subtotal,
      discount,
      tax,
      total
    });

    // Create invoice items
    for (const item of invoiceItems) {
      await InvoiceItem.create({ ...item, invoiceId: invoice.id });
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: require('../models/User'), as: 'cashier' },
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: require('../models/Product'), as: 'product' }]
        },
        {
          model: Payment,
          as: 'payments',
          include: [{ model: require('../models/PaymentMethod'), as: 'method' }]
        }
      ]
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.payInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { payments } = req.body;
    await Invoice.update({ status: 'paid' }, { where: { id } });

    // Create payments
    for (const payment of payments) {
      await Payment.create({ ...payment, invoiceId: id });
    }

    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: require('../models/User'), as: 'cashier' },
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: require('../models/Product'), as: 'product' }]
        },
        {
          model: Payment,
          as: 'payments',
          include: [{ model: require('../models/PaymentMethod'), as: 'method' }]
        }
      ]
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [updated] = await Invoice.update({ status }, { where: { id } });
    if (updated) {
      const invoice = await Invoice.findByPk(id);
      res.json(invoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};