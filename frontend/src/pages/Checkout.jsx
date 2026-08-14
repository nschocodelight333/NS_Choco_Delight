import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createRazorpayOrder, verifyPayment } from '../api/payment';
import { createOrder } from '../api/orders';
import toast from 'react-hot-toast';

const DELIVERY_FEE = 40;
const FREE_DELIVERY_THRESHOLD = 500;

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal } = useCart();
  const items = cart?.items || [];

  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const totalAmount = cartTotal + deliveryFee;

  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
    phone: user?.phone || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'
  const [paying, setPaying] = useState(false);

  const handleAddressChange = (e) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateAddress = () => {
    const required = ['street', 'city', 'state', 'pincode', 'phone'];
    for (const field of required) {
      if (!address[field]?.trim()) {
        toast.error(`Please fill in your ${field}`);
        return false;
      }
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error('Pincode must be 6 digits');
      return false;
    }
    if (!/^\d{10}$/.test(address.phone)) {
      toast.error('Phone must be 10 digits');
      return false;
    }
    return true;
  };

  // Place order with Cash on Delivery
  const handleCodOrder = async () => {
    setPaying(true);
    try {
      const newOrder = await createOrder({
        deliveryAddress: address,
        paymentInfo: {
          status: 'cod',
          razorpayOrderId: '',
          razorpayPaymentId: '',
          razorpaySignature: '',
        },
      });

      toast.success('Order placed successfully with Cash on Delivery! 🍫');
      navigate(`/order-confirmation/${newOrder.data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
      setPaying(false);
    }
  };

  // Place order with Online Payment (Razorpay / GPay / UPI / Cards)
  const handleOnlinePayment = async () => {
    setPaying(true);

    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await createRazorpayOrder(totalAmount);
      const { orderId, amount, currency, keyId } = orderRes.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'NS Choco Delight',
        description: 'Homemade Chocolates Order',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: address.phone || user?.phone || '',
        },
        theme: {
          color: '#3E2723',
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            const verifyRes = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Step 4: Create order in DB
            const newOrder = await createOrder({
              deliveryAddress: address,
              paymentInfo: verifyRes.data.paymentInfo,
            });

            toast.success('Online Payment successful! 🎉');
            navigate(`/order-confirmation/${newOrder.data.order._id}`);
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: 'ℹ️' });
            setPaying(false);
          },
        },
      };

      // Check if Razorpay SDK is loaded
      if (!window.Razorpay) {
        toast.error('Payment gateway initializing... If it takes too long, check connection.');
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed. Try Cash on Delivery.');
      setPaying(false);
    }
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!validateAddress()) return;

    if (paymentMethod === 'cod') {
      handleCodOrder();
    } else {
      handleOnlinePayment();
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center page-container">
        <p className="text-choco-600 text-lg mb-4">Your cart is empty.</p>
        <a href="/products" className="btn-primary">Shop Now</a>
      </div>
    );
  }

  return (
    <div className="py-10 min-h-screen">
      <div className="page-container">
        <h1 className="section-title mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ─── Delivery Address ─────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
              <h2 className="font-display text-xl font-bold text-choco-900 mb-5">📍 Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="checkout-street">Street Address *</label>
                  <textarea
                    id="checkout-street"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    rows={2}
                    placeholder="House/Flat No., Building, Street..."
                    className="input-field resize-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="checkout-city">City *</label>
                    <input
                      id="checkout-city"
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      placeholder="City"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="checkout-state">State *</label>
                    <input
                      id="checkout-state"
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      placeholder="State"
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="checkout-pincode">Pincode *</label>
                    <input
                      id="checkout-pincode"
                      name="pincode"
                      value={address.pincode}
                      onChange={handleAddressChange}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="checkout-phone">Phone *</label>
                    <input
                      id="checkout-phone"
                      name="phone"
                      value={address.phone}
                      onChange={handleAddressChange}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Order Summary + Pay ─────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6 mb-4">
              <h2 className="font-display text-xl font-bold text-choco-900 mb-5">🛒 Order Summary</h2>
              <div className="space-y-3 mb-5 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-choco-50 flex-shrink-0">
                      <img
                        src={item.product?.images?.[0] || ''}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-choco-900 truncate">{item.product?.name}</p>
                      {item.shape && <p className="text-xs text-choco-400">{item.shape} Shape</p>}
                      <p className="text-xs text-choco-500">× {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-choco-900 text-sm">₹{item.product?.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-choco-100 pt-4">
                <div className="flex justify-between text-sm text-choco-700">
                  <span>Items total</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm text-choco-700">
                  <span>Delivery fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {deliveryFee === 0 ? '✓ Free' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-choco-900 text-xl border-t border-choco-100 pt-3 mt-2">
                  <span>Total</span>
                  <span className="font-display">₹{totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6 mb-4">
              <h2 className="font-display text-lg font-bold text-choco-900 mb-4">💳 Payment Method</h2>
              
              <div className="space-y-3">
                {/* Online Payment Option */}
                <label
                  onClick={() => setPaymentMethod('online')}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'online'
                      ? 'border-amber-600 bg-amber-50/40 shadow-sm'
                      : 'border-choco-100 hover:border-choco-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="mt-1 accent-amber-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-choco-900 text-sm">Online Payment (Instant & Secure)</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <p className="text-xs text-choco-500 mt-1">
                      Pay via Google Pay, PhonePe, Paytm, BHIM UPI, Cards, or Net Banking
                    </p>
                    <div className="flex gap-1.5 mt-2.5 flex-wrap">
                      {['GPay 🚀', 'PhonePe', 'Paytm', 'UPI ID', 'Cards'].map((m) => (
                        <span key={m} className="text-[10px] bg-white text-choco-800 font-medium px-2 py-0.5 rounded border border-choco-200 shadow-2xs">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>

                {/* Cash on Delivery Option */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-choco-700 bg-choco-50/60 shadow-sm'
                      : 'border-choco-100 hover:border-choco-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-choco-800"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-choco-900 text-sm">Cash on Delivery (COD)</span>
                      <span className="text-xs bg-choco-100 text-choco-800 font-medium px-2 py-0.5 rounded-full">Pay at Doorstep</span>
                    </div>
                    <p className="text-xs text-choco-500 mt-1">
                      Pay in cash when your fresh homemade chocolates arrive
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={paying}
              id="pay-now-btn"
              className={paymentMethod === 'online' ? 'btn-gold w-full py-4 text-base text-center font-bold shadow-md' : 'btn-primary w-full py-4 text-base text-center font-bold shadow-md'}
            >
              {paying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Processing Order...
                </span>
              ) : paymentMethod === 'online' ? (
                `💳 Pay ₹${totalAmount} via GPay / UPI / Card`
              ) : (
                `📦 Place Order with Cash on Delivery (₹${totalAmount})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
