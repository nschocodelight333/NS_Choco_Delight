const express = require('express');
const { getDashboardStats, getCustomers, getDashboardAnalytics } = require('../controllers/adminController');
const {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllCampaigns,
} = require('../controllers/campaignController');
const {
  getAllCustomOrders,
  setQuote,
  updateCustomOrderStatus,
} = require('../controllers/customOrderController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect, adminOnly); // All admin routes require admin role

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardStats);
router.get('/dashboard/stats', getDashboardAnalytics);

// ── Customers ─────────────────────────────────────────────────────────────────
router.get('/customers', getCustomers);

// ── Campaigns ─────────────────────────────────────────────────────────────────
router.get('/campaigns', getAllCampaigns);
router.post('/campaigns', upload.single('bannerImage'), createCampaign);
router.put('/campaigns/:id', upload.single('bannerImage'), updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// ── Custom Order Requests ─────────────────────────────────────────────────────
router.get('/custom-orders', getAllCustomOrders);
router.put('/custom-orders/:id/quote', setQuote);
router.put('/custom-orders/:id/status', updateCustomOrderStatus);

module.exports = router;
