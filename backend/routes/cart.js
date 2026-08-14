const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All cart routes require authentication

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/:itemId').put(updateCartItem).delete(removeCartItem);

module.exports = router;
