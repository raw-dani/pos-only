const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

router.get('/', auth, invoiceController.getInvoices);
router.post('/', auth, invoiceController.createInvoice);
router.put('/:id/pay', auth, invoiceController.payInvoice);
router.put('/:id/status', auth, invoiceController.updateInvoiceStatus);

module.exports = router;