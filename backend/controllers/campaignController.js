const Campaign = require('../models/Campaign');
const cloudinary = require('../config/cloudinary');

// ─── Admin: Create Campaign ───────────────────────────────────────────────────
// @route POST /api/admin/campaigns
const createCampaign = async (req, res) => {
  const { title, occasion, description, startDate, endDate, isActive, products, hampers } = req.body;

  // Handle uploaded banner image
  const bannerImageUrl = req.file ? req.file.path : (req.body.bannerImageUrl || '');

  // Parse JSON fields if sent as strings (multipart)
  let parsedProducts = [];
  if (products) {
    parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
  }

  let parsedHampers = [];
  if (hampers) {
    parsedHampers = typeof hampers === 'string' ? JSON.parse(hampers) : hampers;
  }

  const campaign = await Campaign.create({
    title,
    occasion: occasion || 'Custom',
    description: description || '',
    bannerImageUrl,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isActive: isActive === 'false' || isActive === false ? false : true,
    products: parsedProducts,
    hampers: parsedHampers,
  });

  await campaign.populate('products', 'name price images');
  res.status(201).json({ success: true, campaign });
};

// ─── Admin: Update Campaign ───────────────────────────────────────────────────
// @route PUT /api/admin/campaigns/:id
const updateCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    const err = new Error('Campaign not found');
    err.statusCode = 404;
    throw err;
  }

  const { title, occasion, description, startDate, endDate, isActive, products, hampers, removeBanner } = req.body;

  if (title) campaign.title = title;
  if (occasion) campaign.occasion = occasion;
  if (description !== undefined) campaign.description = description;
  if (startDate) campaign.startDate = new Date(startDate);
  if (endDate) campaign.endDate = new Date(endDate);
  if (isActive !== undefined) campaign.isActive = isActive === 'false' || isActive === false ? false : true;

  if (products !== undefined) {
    campaign.products = typeof products === 'string' ? JSON.parse(products) : products;
  }

  if (hampers !== undefined) {
    campaign.hampers = typeof hampers === 'string' ? JSON.parse(hampers) : hampers;
  }

  // Handle new banner image upload
  if (req.file) {
    // Delete old banner from Cloudinary if it exists
    if (campaign.bannerImageUrl) {
      try {
        const publicId = campaign.bannerImageUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (e) { /* ignore */ }
    }
    campaign.bannerImageUrl = req.file.path;
  }

  // Remove banner if requested
  if (removeBanner === 'true' && campaign.bannerImageUrl) {
    try {
      const publicId = campaign.bannerImageUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (e) { /* ignore */ }
    campaign.bannerImageUrl = '';
  }

  await campaign.save();
  await campaign.populate('products', 'name price images');
  res.json({ success: true, campaign });
};

// ─── Admin: Delete Campaign ───────────────────────────────────────────────────
// @route DELETE /api/admin/campaigns/:id
const deleteCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    const err = new Error('Campaign not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete banner from Cloudinary
  if (campaign.bannerImageUrl) {
    try {
      const publicId = campaign.bannerImageUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (e) { /* ignore */ }
  }

  // Delete hamper images
  for (const hamper of campaign.hampers) {
    if (hamper.imageUrl) {
      try {
        const publicId = hamper.imageUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (e) { /* ignore */ }
    }
  }

  await campaign.deleteOne();
  res.json({ success: true, message: 'Campaign deleted.' });
};

// ─── Admin: List All Campaigns ────────────────────────────────────────────────
// @route GET /api/admin/campaigns
const getAllCampaigns = async (req, res) => {
  const campaigns = await Campaign.find()
    .populate('products', 'name price images category')
    .populate('hampers.includedItems', 'name price')
    .sort({ createdAt: -1 });

  res.json({ success: true, campaigns });
};

// ─── Public: Get Active Campaigns ─────────────────────────────────────────────
// @route GET /api/campaigns/active
const getActiveCampaigns = async (req, res) => {
  const now = new Date();
  const campaigns = await Campaign.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .populate('products', 'name price images category isAvailable')
    .populate('hampers.includedItems', 'name price images')
    .sort({ createdAt: -1 });

  res.json({ success: true, campaigns });
};

// ─── Public: Get Single Campaign ──────────────────────────────────────────────
// @route GET /api/campaigns/:id
const getCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('products', 'name price images category isAvailable description ratingAverage')
    .populate('hampers.includedItems', 'name price images');

  if (!campaign) {
    const err = new Error('Campaign not found');
    err.statusCode = 404;
    throw err;
  }

  res.json({ success: true, campaign });
};

module.exports = {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllCampaigns,
  getActiveCampaigns,
  getCampaign,
};
