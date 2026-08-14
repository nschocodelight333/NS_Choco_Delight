const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { createReview, getProductReviews, checkCanReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(protect, adminOnly, upload.array('images', 5), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, adminOnly, upload.array('images', 5), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

// Check if authenticated user can review this product
router.get('/:id/can-review', protect, checkCanReview);

router
  .route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, createReview);

module.exports = router;
