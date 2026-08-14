const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const DELIVERY_FEE = 40;
const FREE_DELIVERY_THRESHOLD = 500;

// @desc    Create order (called after payment success)
// @route   POST /api/orders
// @access  Protected
const createOrder = async (req, res) => {
  const { deliveryAddress, paymentInfo } = req.body;

  // Get user cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty.' });
  }

  // Build order items and deduct stock
  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product) continue;
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `${product.name} is out of stock.`,
      });
    }
    product.stock -= item.quantity;
    await product.save();

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      quantity: item.quantity,
      shape: item.shape || '',
    });
  }

  const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = itemsTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const totalAmount = itemsTotal + deliveryFee;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    deliveryAddress,
    itemsTotal,
    deliveryFee,
    totalAmount,
    paymentInfo,
    orderStatus: paymentInfo?.status === 'paid' ? 'Confirmed' : 'Pending',
  });

  // Clear the cart after order creation
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json({ success: true, order });
};

// @desc    Get orders (own for customer, all for admin)
// @route   GET /api/orders
// @access  Protected
const getOrders = async (req, res) => {
  const { all, status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (req.user.role !== 'admin' || all !== 'true') {
    query.user = req.user._id;
  }
  if (status) query.orderStatus = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, total, orders });
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Protected
const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  // Customers can only view their own orders
  if (req.user.role !== 'admin') {
    if (!order.user || order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }
  }

  res.json({ success: true, order });
};

// @desc    Create manual WhatsApp order (admin only)
// @route   POST /api/orders/manual
// @access  Admin
const createManualOrder = async (req, res) => {
  const {
    customerName,
    customerPhone,
    address, // { street, city, state, pincode }
    items,   // [{ productId, quantity, shape, price }]
    paymentStatus, // 'paid', 'pending', 'cod'
    notes,
  } = req.body;

  if (!customerName || !customerPhone || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required customer details or order items.' });
  }

  const orderItems = [];

  // Validate items, check stock, and deduct
  for (const item of items) {
    const { productId, quantity, shape, price: customPrice } = item;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product not found with ID ${productId}` });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
      });
    }

    // Deduct stock
    product.stock -= Number(quantity);
    await product.save();

    // Use overridden price if provided, otherwise default to product price
    const finalPrice = customPrice !== undefined && customPrice !== null && customPrice !== ''
      ? Number(customPrice)
      : product.price;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: finalPrice,
      quantity: Number(quantity),
      shape: shape || '',
    });
  }

  // Calculate itemsTotal, delivery fee, and grand total
  const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = itemsTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const totalAmount = itemsTotal + deliveryFee;

  const order = await Order.create({
    orderSource: 'whatsapp',
    guestCustomer: {
      name: customerName,
      phone: customerPhone,
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        pincode: address?.pincode || '',
      },
    },
    deliveryAddress: {
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      pincode: address?.pincode || '',
      phone: customerPhone,
    },
    items: orderItems,
    itemsTotal,
    deliveryFee,
    totalAmount,
    paymentInfo: {
      status: paymentStatus || 'pending',
    },
    orderStatus: 'Confirmed', // Admin created manual orders are Confirmed by default
    notes: notes || '',
  });

  res.status(201).json({ success: true, order });
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid order status.' });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus },
    { new: true }
  ).populate('user', 'name email phone');

  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  res.json({ success: true, order });
};

module.exports = { createOrder, getOrders, getOrder, createManualOrder, updateOrderStatus };
