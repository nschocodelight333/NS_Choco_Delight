const express = require('express');
const { getActiveCampaigns, getCampaign } = require('../controllers/campaignController');

const router = express.Router();

// Public routes — no auth required
router.get('/active', getActiveCampaigns);
router.get('/:id', getCampaign);

module.exports = router;
