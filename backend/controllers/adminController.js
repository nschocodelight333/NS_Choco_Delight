const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardStats = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    totalRevenue,
    pendingOrders,
    totalCustomers,
    lowStockProducts,
    recentOrders,
    ordersByStatus,
    websiteOrdersThisMonth,
    whatsappOrdersThisMonth,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { 'paymentInfo.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ orderStatus: 'Pending' }),
    User.countDocuments({ role: 'customer' }),
    Product.find({ stock: { $lte: 5 } }).select('name stock category').limit(10),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email'),
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ orderSource: 'website', createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ orderSource: 'whatsapp', createdAt: { $gte: startOfMonth } }),
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingOrders,
      totalCustomers,
      lowStockProducts,
      recentOrders,
      ordersByStatus,
      websiteOrdersThisMonth,
      whatsappOrdersThisMonth,
    },
  });
};

// @desc    Get all customers (view only)
// @route   GET /api/admin/customers
// @access  Admin
const getCustomers = async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ success: true, customers });
};

// @desc    Get detailed analytics (orders + revenue by time period & payment method)
// @route   GET /api/admin/dashboard/stats
// @access  Admin
const getDashboardAnalytics = async (req, res) => {
  const now = new Date();

  // ── Date range helpers ────────────────────────────────────────────
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(startOfToday);

  // Week starts on Monday
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ...
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() + diffToMonday);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // ── Build a facet stage for one time period ───────────────────────
  const buildFacet = (start, end) => [
    {
      $match: {
        createdAt: end ? { $gte: start, $lt: end } : { $gte: start },
        orderStatus: { $ne: 'Cancelled' },
        'paymentInfo.status': { $ne: 'failed' },
      },
    },
    {
      $group: {
        _id: '$paymentInfo.status',
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
  ];

  const [result] = await Order.aggregate([
    {
      $facet: {
        today: buildFacet(startOfToday, null),
        yesterday: buildFacet(startOfYesterday, endOfYesterday),
        thisWeek: buildFacet(startOfWeek, null),
        thisMonth: buildFacet(startOfMonth, null),
        thisYear: buildFacet(startOfYear, null),
      },
    },
  ]);

  // ── Parse facet results into a clean shape ────────────────────────
  const parsePeriod = (rows) => {
    const upiRow = rows.find((r) => r._id === 'paid');
    const codRow = rows.find((r) => r._id === 'cod');
    const upiRevenue = upiRow?.revenue || 0;
    const codRevenue = codRow?.revenue || 0;
    const upiCount = upiRow?.count || 0;
    const codCount = codRow?.count || 0;
    return {
      orders: upiCount + codCount,
      upiRevenue,
      codRevenue,
      totalRevenue: upiRevenue + codRevenue,
    };
  };

  res.json({
    success: true,
    analytics: {
      today: parsePeriod(result?.today || []),
      yesterday: parsePeriod(result?.yesterday || []),
      thisWeek: parsePeriod(result?.thisWeek || []),
      thisMonth: parsePeriod(result?.thisMonth || []),
      thisYear: parsePeriod(result?.thisYear || []),
    },
  });
};

module.exports = { getDashboardStats, getCustomers, getDashboardAnalytics };
