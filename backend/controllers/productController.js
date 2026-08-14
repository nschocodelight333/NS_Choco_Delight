const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc    Get all products with filters/search/sort/pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    rating,
    sort,
    page = 1,
    limit = 12,
    featured,
  } = req.query;

  const query = {};

  // Filters
  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;
  if (search) query.$text = { $search: search };

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (rating) query.ratingAverage = { $gte: Number(rating) };

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'rating') sortOption = { ratingAverage: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    products,
  });
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, product });
};

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res) => {
  const { name, description, category, shapeOptions, price, stock, isFeatured } = req.body;

  // Handle uploaded images (Cloudinary URLs from multer)
  const images = req.files ? req.files.map((f) => f.path) : [];

  // Parse shapeOptions if sent as JSON string
  let parsedShapeOptions = [];
  if (shapeOptions) {
    parsedShapeOptions = typeof shapeOptions === 'string' ? JSON.parse(shapeOptions) : shapeOptions;
  }

  const product = await Product.create({
    name,
    description,
    category,
    shapeOptions: parsedShapeOptions,
    price: Number(price),
    stock: Number(stock),
    images,
    isFeatured: isFeatured === 'true' || isFeatured === true,
  });

  res.status(201).json({ success: true, product });
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  const { name, description, category, shapeOptions, price, stock, isFeatured, removeImages } = req.body;

  if (name) product.name = name;
  if (description) product.description = description;
  if (category) product.category = category;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;
  if (shapeOptions) {
    product.shapeOptions = typeof shapeOptions === 'string' ? JSON.parse(shapeOptions) : shapeOptions;
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => f.path);
    product.images = [...product.images, ...newImages];
  }

  // Remove specific images
  if (removeImages) {
    const toRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
    // Delete from Cloudinary
    for (const imgUrl of toRemove) {
      try {
        const publicId = imgUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        // Continue even if Cloudinary delete fails
      }
    }
    product.images = product.images.filter((img) => !toRemove.includes(img));
  }

  await product.save();
  res.json({ success: true, product });
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete images from Cloudinary
  for (const imgUrl of product.images) {
    try {
      const publicId = imgUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      // Continue even if Cloudinary delete fails
    }
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted successfully.' });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
