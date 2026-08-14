const express = require('express');
const { protect } = require('../middleware/auth');
const {
  submitCustomOrder,
  getMyCustomOrders,
  respondToQuote,
  checkoutCustomOrder,
} = require('../controllers/customOrderController');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require customer login
router.use(protect);

router.post('/', upload.array('referenceImages', 5), submitCustomOrder);
router.get('/my', getMyCustomOrders);
router.post('/:id/respond', respondToQuote);
router.post('/:id/checkout', checkoutCustomOrder);

module.exports = router;
