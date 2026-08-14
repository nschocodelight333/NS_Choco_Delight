const express = require('express');
const {
  createOrder,
  getOrders,
  getOrder,
  createManualOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

router.use(protect);

router.route('/').get(getOrders).post(createOrder);
router.route('/manual').post(adminOnly, createManualOrder);
router.route('/:id').get(getOrder);
router.route('/:id/status').put(adminOnly, updateOrderStatus);

module.exports = router;
