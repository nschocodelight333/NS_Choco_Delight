import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, createManualOrder } from '../../api/orders';
import { getProducts } from '../../api/products';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  Pending: 'badge-pending',
  Confirmed: 'badge-confirmed',
  Preparing: 'badge-preparing',
  'Out for Delivery': 'badge-delivery',
  Delivered: 'badge-delivered',
  Cancelled: 'badge-cancelled',
};

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // [{ product, quantity, shape, price }]
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  useEffect(() => {
    if (showModal) {
      getProducts({ limit: 100 })
        .then((res) => {
          setProductsList(res.data.products || []);
        })
        .catch(() => {
          toast.error('Failed to load products list');
        });
    }
  }, [showModal]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { all: true };
      if (filterStatus) params.status = filterStatus;
      const res = await getOrders(params);
      setOrders(res.data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data.order : o)));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddItem = (product) => {
    const defaultShape = product.shapeOptions?.length > 0 ? product.shapeOptions[0] : '';
    const exists = selectedItems.find(
      (item) => item.product._id === product._id && item.shape === defaultShape
    );
    if (exists) {
      toast.error('Product already added. Update its quantity instead.');
      return;
    }

    setSelectedItems([
      ...selectedItems,
      {
        product,
        quantity: 1,
        shape: defaultShape,
        price: product.price,
      },
    ]);
    setSearchTerm('');
  };

  const handleUpdateItem = (index, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const itemsTotal = selectedItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const deliveryFee = itemsTotal >= 500 || itemsTotal === 0 ? 0 : 40;
  const grandTotal = itemsTotal + deliveryFee;

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Customer name and phone number are required');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        address: { street, city, state, pincode },
        items: selectedItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          shape: item.shape,
          price: item.price,
        })),
        paymentStatus,
        notes,
      };

      await createManualOrder(payload);
      toast.success('WhatsApp order added successfully!');
      setShowModal(false);
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setStreet('');
      setCity('');
      setPincode('');
      setSelectedItems([]);
      setPaymentStatus('pending');
      setNotes('');
      // Refresh list
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create manual order');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = productsList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-choco-900">Orders</h1>
          <p className="text-choco-500 mt-1">{orders.length} orders</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto py-2.5 px-5 text-sm"
        >
          💬 Add WhatsApp Order
        </button>
      </div>

      {/* Filter by status */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!filterStatus ? 'bg-choco-800 text-cream' : 'bg-white text-choco-700 border border-choco-200 hover:border-choco-400'}`}
          id="filter-all-orders"
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === status ? 'bg-choco-800 text-cream' : 'bg-white text-choco-700 border border-choco-200 hover:border-choco-400'}`}
            id={`filter-status-${status.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-choco-100 overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-choco-400">
              <span className="text-5xl block mb-3">📦</span>
              <p>No orders found{filterStatus ? ` with status "${filterStatus}"` : ''}.</p>
            </div>
          ) : (
            <div className="divide-y divide-choco-50">
              {orders.map((order) => (
                <div key={order._id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className={STATUS_COLORS[order.orderStatus] || 'badge bg-gray-100 text-gray-700'}>
                          {order.orderStatus}
                        </span>
                        {order.paymentInfo?.status === 'paid' && (
                          <span className="badge bg-green-100 text-green-700">✓ Paid</span>
                        )}
                        {order.paymentInfo?.status === 'cod' && (
                          <span className="badge bg-orange-100 text-orange-700">COD</span>
                        )}
                        {order.orderSource === 'whatsapp' ? (
                          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full">
                            💬 WhatsApp
                          </span>
                        ) : (
                          <span className="badge bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full">
                            🌐 Website
                          </span>
                        )}
                        <span className="font-mono text-xs text-choco-400">#{order._id.slice(-8).toUpperCase()}</span>
                      </div>
                      {order.orderSource === 'whatsapp' ? (
                        <>
                          <p className="font-semibold text-choco-900">{order.guestCustomer?.name || 'Guest'}</p>
                          <p className="text-choco-500 text-xs">{order.guestCustomer?.phone} · WhatsApp Order</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-choco-900">{order.user?.name}</p>
                          <p className="text-choco-500 text-xs">{order.user?.email} · {order.user?.phone}</p>
                        </>
                      )}
                      <p className="text-choco-400 text-xs mt-1">
                        {new Date(order.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-center">
                      <p className="font-display text-xl font-bold text-choco-900">₹{order.totalAmount}</p>
                      <p className="text-choco-400 text-xs">{order.items.length} items</p>
                    </div>

                    {/* Status Update + Expand */}
                    <div className="flex items-center gap-2">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        disabled={updatingStatus === order._id}
                        id={`status-select-${order._id}`}
                        className="input-field max-w-[180px] py-2 text-sm"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        className="p-2 text-choco-500 hover:text-choco-900 hover:bg-choco-50 rounded-lg transition-colors"
                        id={`expand-order-${order._id}`}
                        aria-label={expandedOrder === order._id ? 'Collapse' : 'Expand'}
                      >
                        <svg className={`w-5 h-5 transition-transform ${expandedOrder === order._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded: items + address */}
                  {expandedOrder === order._id && (
                    <div className="mt-4 pt-4 border-t border-choco-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-choco-700 mb-2 uppercase tracking-wide">Items</p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-choco-700">{item.name} {item.shape ? `(${item.shape})` : ''} × {item.quantity}</span>
                              <span className="font-medium text-choco-900">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-choco-50 flex justify-between font-semibold text-choco-900">
                          <span>Total</span>
                          <span>₹{order.totalAmount}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-choco-700 mb-2 uppercase tracking-wide">Delivery Address</p>
                        {order.orderSource === 'whatsapp' ? (
                          <>
                            <p className="text-choco-700 text-sm leading-relaxed">
                              {order.guestCustomer?.address?.street || 'N/A'}<br />
                              {order.guestCustomer?.address?.city || 'N/A'}, {order.guestCustomer?.address?.state || 'N/A'}<br />
                              {order.guestCustomer?.address?.pincode || 'N/A'}
                            </p>
                            <p className="text-choco-500 text-sm mt-1">📞 {order.guestCustomer?.phone}</p>
                            {order.notes && (
                              <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800">
                                <strong>Notes:</strong> {order.notes}
                              </div>
                            )}
                            <p className="text-xs text-choco-400 mt-2 font-medium">Manually entered — no customer account</p>
                          </>
                        ) : (
                          <>
                            <p className="text-choco-700 text-sm leading-relaxed">
                              {order.deliveryAddress?.street}<br />
                              {order.deliveryAddress?.city}, {order.deliveryAddress?.state}<br />
                              {order.deliveryAddress?.pincode}
                            </p>
                            <p className="text-choco-500 text-sm mt-1">📞 {order.deliveryAddress?.phone}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log WhatsApp Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex justify-between items-center border-b border-choco-100 pb-3">
              <h2 className="font-display text-2xl font-bold text-choco-900 flex items-center gap-2">
                💬 Log WhatsApp Order
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-choco-400 hover:text-choco-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-choco-700 uppercase mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-choco-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="border border-choco-100 rounded-xl p-3 bg-choco-50/30 space-y-3">
                <p className="text-xs font-bold text-choco-700 uppercase">Delivery Address</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="input-field w-full text-sm"
                      placeholder="Street Address"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-field w-full text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input-field w-full text-sm"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="input-field w-full text-sm"
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-choco-700 uppercase">Add Products</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field w-full"
                    placeholder="Search products by name..."
                  />
                  {searchTerm && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-choco-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10 divide-y divide-choco-50">
                      {filteredProducts.length === 0 ? (
                        <p className="p-3 text-sm text-choco-400 text-center">No products found</p>
                      ) : (
                        filteredProducts.map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => handleAddItem(p)}
                            className="w-full text-left p-3 hover:bg-choco-50 transition-colors flex justify-between items-center"
                          >
                            <div>
                              <span className="font-medium text-choco-900 text-sm">{p.name}</span>
                              <span className="text-xs text-choco-400 block">{p.category} · Stock: {p.stock}</span>
                            </div>
                            <span className="font-semibold text-choco-700 text-sm">₹{p.price}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="space-y-3 border border-choco-100 rounded-xl p-3 bg-white max-h-60 overflow-y-auto">
                  <p className="text-xs font-bold text-choco-700 uppercase mb-1">Selected Items</p>
                  {selectedItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-choco-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-choco-900">{item.product.name}</span>
                        {item.product.shapeOptions?.length > 0 && (
                          <div className="flex gap-2 mt-1">
                            <select
                              value={item.shape}
                              onChange={(e) => handleUpdateItem(index, 'shape', e.target.value)}
                              className="input-field py-1 px-2 text-xs"
                            >
                              {item.product.shapeOptions.map((sh) => (
                                <option key={sh} value={sh}>{sh} Shape</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <label className="text-[10px] text-choco-500 mr-1 uppercase">Qty</label>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="input-field w-16 py-1 text-center text-sm"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="text-[10px] text-choco-500 mr-1 uppercase">Price</label>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              handleUpdateItem(index, 'price', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            className="input-field w-20 py-1 text-center text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-sm"
                          title="Remove"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-choco-700 uppercase mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="paid">Paid (UPI/Cash)</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-choco-700 uppercase mb-1">Order Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field w-full py-2 text-sm"
                    placeholder="Special instructions, custom requests, etc."
                    rows="2"
                  />
                </div>
              </div>

              <div className="bg-choco-50 rounded-xl p-4 flex flex-col gap-1 border border-choco-100 text-sm">
                <div className="flex justify-between text-choco-600">
                  <span>Items Total</span>
                  <span>₹{itemsTotal}</span>
                </div>
                <div className="flex justify-between text-choco-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? '✓ Free' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between font-bold text-choco-900 text-base border-t border-choco-200 pt-1 mt-1">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-choco-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary py-2.5 px-5 text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
