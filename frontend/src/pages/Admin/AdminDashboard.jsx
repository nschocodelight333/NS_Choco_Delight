import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDashboardStats, getDashboardAnalytics } from '../../api/admin';

const StatCard = ({ icon, label, value, color, delay, subtext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className={`bg-white rounded-2xl shadow-sm border border-choco-100 p-6`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-choco-500 text-sm">{label}</p>
        <p className="font-display text-3xl font-bold text-choco-900 mt-0.5">{value}</p>
        {subtext && <p className="text-xs text-choco-400 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
    getDashboardAnalytics()
      .then((res) => setAnalytics(res.data.analytics))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, []);

  const STATUS_COLORS = {
    Pending: 'text-yellow-700 bg-yellow-50',
    Confirmed: 'text-blue-700 bg-blue-50',
    Preparing: 'text-purple-700 bg-purple-50',
    'Out for Delivery': 'text-orange-700 bg-orange-50',
    Delivered: 'text-green-700 bg-green-50',
    Cancelled: 'text-red-700 bg-red-50',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-choco-900">Dashboard</h1>
        <p className="text-choco-500 mt-1">Overview of your chocolate business</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6 h-28 skeleton" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon="📦"
              label="Total Orders"
              value={stats.totalOrders}
              color="bg-blue-50"
              delay={0}
              subtext={`${stats.websiteOrdersThisMonth || 0} website / ${stats.whatsappOrdersThisMonth || 0} WhatsApp this month`}
            />
            <StatCard icon="💰" label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} color="bg-green-50" delay={0.1} />
            <StatCard icon="⏳" label="Pending Orders" value={stats.pendingOrders} color="bg-yellow-50" delay={0.2} />
            <StatCard icon="👥" label="Customers" value={stats.totalCustomers} color="bg-purple-50" delay={0.3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-choco-900 text-lg">Recent Orders</h2>
                <Link to="/admin/orders" className="text-choco-600 hover:text-choco-900 text-sm font-medium">View all →</Link>
              </div>
              {stats.recentOrders?.length === 0 ? (
                <p className="text-choco-400 text-sm text-center py-6">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentOrders?.map((order) => (
                    <div key={order._id} className="flex items-center justify-between py-2 border-b border-choco-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-choco-900">
                          {order.orderSource === 'whatsapp' ? order.guestCustomer?.name : order.user?.name}
                        </p>
                        <p className="text-xs text-choco-400">#{order._id.slice(-6).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[order.orderStatus] || ''}`}>
                          {order.orderStatus}
                        </span>
                        <span className="font-semibold text-choco-900 text-sm">₹{order.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-choco-900 text-lg">
                  ⚠️ Low Stock Alert
                </h2>
                <Link to="/admin/products" className="text-choco-600 hover:text-choco-900 text-sm font-medium">Manage →</Link>
              </div>
              {stats.lowStockProducts?.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-3xl block mb-2">✅</span>
                  <p className="text-green-600 font-medium text-sm">All products well stocked!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.lowStockProducts.map((product) => (
                    <div key={product._id} className="flex items-center justify-between py-2 border-b border-choco-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-choco-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-choco-400">{product.category}</p>
                      </div>
                      <span className={`badge text-xs px-2 py-0.5 rounded-full ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
            <h2 className="font-display font-bold text-choco-900 text-lg mb-5">Orders by Status</h2>
            <div className="flex flex-wrap gap-3">
              {stats.ordersByStatus?.map((item) => (
                <div key={item._id} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${STATUS_COLORS[item._id] || 'bg-gray-50 text-gray-700'}`}>
                  <span className="font-bold text-lg">{item.count}</span>
                  <span className="text-sm">{item._id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Revenue Analytics ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-choco-900 text-lg">Revenue Analytics</h2>
                <p className="text-choco-400 text-xs mt-0.5">Orders &amp; revenue by time period (excludes cancelled/failed)</p>
              </div>
            </div>
            {analyticsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-36 bg-choco-50 animate-pulse rounded-2xl" />)}
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { key: 'today', label: 'Today', icon: '☀️' },
                  { key: 'yesterday', label: 'Yesterday', icon: '📅' },
                  { key: 'thisWeek', label: 'This Week', icon: '📆' },
                  { key: 'thisMonth', label: 'This Month', icon: '🗓️' },
                  { key: 'thisYear', label: 'This Year', icon: '📊' },
                ].map(({ key, label, icon }, i) => {
                  const d = analytics[key];
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.4 }}
                      className="bg-choco-50 rounded-2xl p-4 border border-choco-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{icon}</span>
                        <p className="font-semibold text-choco-700 text-sm">{label}</p>
                      </div>
                      <p className="font-display text-2xl font-bold text-choco-900">{d.orders}</p>
                      <p className="text-choco-400 text-xs mb-3">orders</p>
                      <div className="space-y-1.5 pt-3 border-t border-choco-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-choco-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>UPI</span>
                          <span className="text-xs font-semibold text-choco-800">₹{d.upiRevenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-choco-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>COD</span>
                          <span className="text-xs font-semibold text-choco-800">₹{d.codRevenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-choco-100">
                          <span className="text-xs font-bold text-choco-700">Total</span>
                          <span className="text-sm font-bold text-choco-900">₹{d.totalRevenue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-choco-400 text-sm">Could not load analytics.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-choco-500">Could not load stats.</p>
      )}
    </div>
  );
};

export default AdminDashboard;
