import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder } from '../api/orders';

const STATUS_COLORS = {
  Pending: 'badge-pending',
  Confirmed: 'badge-confirmed',
  Preparing: 'badge-preparing',
  'Out for Delivery': 'badge-delivery',
  Delivered: 'badge-delivered',
  Cancelled: 'badge-cancelled',
};

const statusSteps = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(id)
      .then((res) => setOrder(res.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-5xl float-animation">🍫</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-choco-600">Order not found.</p>
        <Link to="/orders" className="btn-primary mt-4 inline-flex">Back to Orders</Link>
      </div>
    );
  }

  const currentStep = statusSteps.indexOf(order.orderStatus);

  return (
    <div className="py-10 min-h-screen">
      <div className="page-container max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/orders" className="text-choco-600 hover:text-choco-900 transition-colors text-sm">← Back to Orders</Link>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <h1 className="font-display text-3xl font-bold text-choco-900">Order Details</h1>
          <span className={STATUS_COLORS[order.orderStatus] || 'badge bg-gray-100 text-gray-700'}>
            {order.orderStatus}
          </span>
          {order.orderSource === 'whatsapp' ? (
            <span className="badge bg-green-100 text-green-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              💬 WhatsApp
            </span>
          ) : (
            <span className="badge bg-blue-100 text-blue-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              🌐 Website
            </span>
          )}
        </div>

        {/* Order ID */}
        <div className="bg-choco-50 rounded-xl p-4 mb-6">
          <p className="text-choco-500 text-xs">Order ID</p>
          <p className="font-mono font-bold text-choco-900">{order._id}</p>
          <p className="text-choco-400 text-xs mt-1">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>

        {/* Status Tracker */}
        {order.orderStatus !== 'Cancelled' && (
          <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6 mb-6">
            <h2 className="font-semibold text-choco-900 mb-5">Tracking</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-choco-100 z-0" />
              {statusSteps.map((step, i) => (
                <div key={step} className="flex flex-col items-center z-10 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    i <= currentStep ? 'bg-choco-800 border-choco-800 text-cream' : 'bg-white border-choco-200 text-choco-400'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] mt-2 text-center leading-tight max-w-[50px] ${i <= currentStep ? 'text-choco-800 font-medium' : 'text-choco-400'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6 mb-6">
          <h2 className="font-semibold text-choco-900 mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-choco-50 last:border-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-choco-50 flex-shrink-0">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🍫</div>
                  }
                </div>
                <div className="flex-1">
                  <p className="font-medium text-choco-900 text-sm">{item.name}</p>
                  {item.shape && <p className="text-xs text-choco-400">{item.shape} Shape</p>}
                  <p className="text-xs text-choco-500">₹{item.price} × {item.quantity}</p>
                </div>
                <span className="font-bold text-choco-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-sm text-choco-600">
              <span>Items total</span><span>₹{order.itemsTotal}</span>
            </div>
            <div className="flex justify-between text-sm text-choco-600">
              <span>Delivery</span>
              <span>{order.deliveryFee === 0 ? '✓ Free' : `₹${order.deliveryFee}`}</span>
            </div>
            <div className="flex justify-between font-bold text-choco-900 text-lg border-t border-choco-100 pt-2">
              <span>Total</span><span className="font-display">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
          <h2 className="font-semibold text-choco-900 mb-3">Delivery Address</h2>
          {order.orderSource === 'whatsapp' ? (
            <>
              <p className="text-choco-700 text-sm">
                {order.guestCustomer?.address?.street}, {order.guestCustomer?.address?.city}, {order.guestCustomer?.address?.state} — {order.guestCustomer?.address?.pincode}
              </p>
              <p className="text-choco-500 text-sm mt-1">📞 {order.guestCustomer?.phone}</p>
              {order.notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800">
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}
              <p className="text-xs text-choco-400 mt-2 font-medium">Manually entered — no customer account</p>
            </>
          ) : (
            <>
              <p className="text-choco-700 text-sm">
                {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} — {order.deliveryAddress?.pincode}
              </p>
              <p className="text-choco-500 text-sm mt-1">📞 {order.deliveryAddress?.phone}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
