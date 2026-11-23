import { getPaymentLabel } from '../../utils/paymentLabel';
import { checkoutTotals } from '../../utils/checkout';
import { useState } from 'react';
import { AlertCircle, CircleCheck, CreditCard, Loader2, ShoppingCart, Store, Truck } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createPaymentOrder, verifyPayment, placeCodOrder } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Checkout.css';
import { useCart } from '../../context/CartContext';

const Checkout = () => {
  const toast = useToast();
  const { state } = useLocation();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [addressErrors, setAddressErrors] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: user?.name || '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [orderType, setOrderType] = useState('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [pendingVerification, setPendingVerification] = useState(null);

  const items = state?.items;
  if (!items?.length) {
    return (
      <div className="checkout-page page container" style={{ paddingTop: '100px' }}>
        <div className="checkout-card" style={{ textAlign: 'center' }}>
          <p>No pizza selected. <Link to="/build-pizza">Build one first!</Link></p>
        </div>
      </div>
    );
  }

  const dineIn = orderType === 'DINE_IN';
  const { label: onlineLabel, icon: OnlineIcon } = getPaymentLabel({ orderType, paymentMethod: 'ONLINE' }, { checkout: true });
  const { label: cashLabel, icon: CashIcon } = getPaymentLabel({ orderType, paymentMethod: 'COD' }, { checkout: true });
  const { subtotal, deliveryFee, taxes, total: grandTotal } = checkoutTotals(items, orderType);
  const requiredFields = dineIn ? ['name', 'phone'] : ['name', 'phone', 'line1', 'city', 'state', 'postalCode'];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => { script.remove(); resolve(false); };
      document.body.appendChild(script);
    });
  };

  const showPaymentError = (message) => {
    setCheckoutError(message);
    toast.error(message);
  };

  const confirmPayment = async (response) => {
    setPendingVerification(response);
    setLoading(true);
    try {
      await verifyPayment(response);
      setOrderPlaced(true);
      setPendingVerification(null);
      if (state.fromCart) clearCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      showPaymentError(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setCheckoutError('');
    setAddressErrors({});
    if (pendingVerification) return confirmPayment(pendingVerification);
    const missing = requiredFields.filter((field) => !deliveryAddress[field].trim());
    if (missing.length) {
      const message = dineIn ? 'Please enter your full name and mobile number' : 'Please complete your delivery address';
      setAddressErrors(Object.fromEntries(missing.map((field) => [field, message])));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(deliveryAddress.phone)) {
      setAddressErrors({ phone: 'Enter a valid 10-digit Indian mobile number' });
      return;
    }
    if (!dineIn && !/^\d{6}$/.test(deliveryAddress.postalCode)) {
      setAddressErrors({ postalCode: 'Enter a valid 6-digit postal code' });
      return;
    }

    setLoading(true);
    let gatewayOpen = false;
    const { name, phone } = deliveryAddress;
    const payload = {
      items: items.map(({ unitPrice, ...item }) => item),
      orderType,
      paymentMethod,
      ...(dineIn ? { contact: { name, phone } } : { deliveryAddress }),
    };
    try {
      if (paymentMethod === 'COD') {
        await placeCodOrder(payload);
        setOrderPlaced(true);
        if (state.fromCart) clearCart();
        toast.success('Cash on Delivery order placed!');
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) { showPaymentError('Razorpay SDK failed to load'); setLoading(false); return; }

      const { data: order } = await createPaymentOrder(payload);
      if (order.amount !== grandTotal * 100) {
        showPaymentError('Payment amount does not match checkout.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Pizzara',
        description: 'Custom Pizza Order',
        order_id: order.id,
        handler: (response) => confirmPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
        modal: { ondismiss: () => setLoading(false) },
        prefill: { name: deliveryAddress.name, email: user?.email, contact: deliveryAddress.phone },
        theme: { color: '#ff6b35' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => showPaymentError('Payment failed. Please try again.'));
      rzp.open();
      gatewayOpen = true;
    } catch (err) {
      showPaymentError(err.response?.data?.message || 'Error initiating payment');
    } finally {
      if (!gatewayOpen) setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page page container" style={{ paddingTop: '100px' }}>
        <div className="checkout-card checkout-success">
          <div className="checkout-success-icon"><CircleCheck size={64} aria-hidden="true" /></div>
          <h2>Order Confirmed!</h2>
          <p>Your custom pizza is being prepared</p>
          <Link to="/my-orders" className="btn btn-primary btn-lg">View My Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page page container" style={{ paddingTop: '100px' }}>
      <h1><ShoppingCart size={28} aria-hidden="true" /> Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-summary-column">
          <div className="checkout-card checkout-summary">
            <h3>Order Summary</h3>
            {items.map((item, index) => (
              <section key={index} className="checkout-summary-line">
                <div className="checkout-item">
                  <strong>{item.name} × {item.quantity}</strong>
                  <strong>₹{item.unitPrice * item.quantity}</strong>
                </div>
                <p className="checkout-item-options">
                  {[item.pizza.base, item.pizza.sauce, item.pizza.cheese, ...(item.pizza.veggies || [])].join(' · ')}
                </p>
              </section>
            ))}
            <div className="checkout-summary-costs">
              <div className="checkout-item"><span>Subtotal</span><span>₹{subtotal}</span></div>
              {!dineIn && <div className="checkout-item"><span>Delivery</span><span>₹{deliveryFee}</span></div>}
              <div className="checkout-item"><span>Taxes (5%)</span><span>₹{taxes}</span></div>
            </div>
            <div className="checkout-total"><span>Total</span><span>₹{grandTotal}</span></div>
          </div>
          <div className="checkout-pay-bar">
            <div className="checkout-mobile-total"><span>Total</span><strong>₹{grandTotal}</strong></div>
            <button aria-busy={loading} className="btn btn-primary btn-lg checkout-pay" onClick={handlePayment} disabled={loading}>
              {loading ? <><Loader2 className="checkout-spinner" size={17} aria-hidden="true" /> Processing...</> : pendingVerification ? 'Retry verification' : paymentMethod === 'COD' ? 'Place order' : <><CreditCard size={18} aria-hidden="true" /> Pay ₹{grandTotal}</>}
            </button>
          </div>
        </div>
        <div className="checkout-card checkout-form-card">
          <div className="payment-methods checkout-order-type" role="radiogroup" aria-label="Order type">
            <h3>Order type</h3>
            {[
              ['DELIVERY', Truck, 'Home delivery', 'We bring it to your door'],
              ['DINE_IN', Store, 'Eat in shop', 'Enjoy it at our shop'],
            ].map(([value, Icon, title, subtitle]) => (
              <label key={value} className={orderType === value ? 'payment-option active' : 'payment-option'}>
                <input
                  type="radio"
                  name="orderType"
                  value={value}
                  checked={orderType === value}
                  disabled={loading || Boolean(pendingVerification)}
                  onChange={() => {
                    setOrderType(value);
                    if (value === 'DINE_IN') setAddressErrors(({ name, phone }) => ({ name, phone }));
                  }}
                />
                <span className="payment-radio-indicator" aria-hidden="true" />
                <Icon size={20} aria-hidden="true" />
                <div><strong>{title}</strong><small>{subtitle}</small></div>
              </label>
            ))}
          </div>
          <div className="checkout-address">
            <h3>{dineIn ? 'Your Details' : 'Delivery Details'}</h3>
            <div className="checkout-address-grid">
              {[
                ['name', 'Full name', 'text', 'name'],
                ['phone', 'Mobile number', 'tel', 'tel', 'tel'],
                ['line1', 'Address line 1', 'text', 'address-line1'],
                ['line2', 'Address line 2 (optional)', 'text', 'address-line2'],
                ['city', 'City', 'text', 'address-level2'],
                ['state', 'State', 'text', 'address-level1'],
                ['postalCode', 'Postal code', 'text', 'postal-code', 'numeric'],
              ].slice(0, dineIn ? 2 : 7).map(([field, label, type, autoComplete, inputMode]) => (
                <div className="form-group" key={field}>
                  <label htmlFor={`checkout-${field}`}>{label}</label>
                  <input
                    id={`checkout-${field}`}
                    aria-invalid={Boolean(addressErrors[field])}
                    aria-describedby={addressErrors[field] ? `checkout-${field}-error` : undefined}
                    className="form-input"
                    type={type}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    value={deliveryAddress[field]}
                    onChange={(e) => {
                      setDeliveryAddress((prev) => ({ ...prev, [field]: e.target.value }));
                      setAddressErrors((prev) => ({ ...prev, [field]: '' }));
                    }}
                    required={field !== 'line2'}
                  />
                  {addressErrors[field] && <small className="checkout-error" id={`checkout-${field}-error`} role="alert">{addressErrors[field]}</small>}
                </div>
              ))}
            </div>
          </div>
          <div className="payment-methods" role="radiogroup" aria-label="Payment method">
            <h3>Payment Method</h3>
            <label className={paymentMethod === 'ONLINE' ? 'payment-option active' : 'payment-option'}>
              <input
                type="radio"
                name="paymentMethod"
                value="ONLINE"
                checked={paymentMethod === 'ONLINE'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-radio-indicator" aria-hidden="true" />
              <OnlineIcon size={20} aria-hidden="true" />
              <div><strong>{onlineLabel}</strong><small>Pay securely online</small></div>
              {checkoutError && (
                <span className="checkout-error checkout-error-banner" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {checkoutError}
                </span>
              )}
            </label>
            <label className={paymentMethod === 'COD' ? 'payment-option active' : 'payment-option'}>
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-radio-indicator" aria-hidden="true" />
              <CashIcon size={20} aria-hidden="true" />
              <div><strong>{cashLabel}</strong><small>{dineIn ? 'Pay at the shop' : 'Pay when your pizza arrives'}</small></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
