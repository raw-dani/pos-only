const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.get('/sales', auth, reportController.getSalesReport);
router.get('/sales/pdf', auth, reportController.exportSalesReportPDF);

module.exports = router;