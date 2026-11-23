import { Banknote, CreditCard } from 'lucide-react';

export function getPaymentLabel(order, { checkout = false } = {}) {
  const { paymentMethod, paymentStatus, orderType, razorpayPaymentId } = order;
  const legacyOnline = Boolean(razorpayPaymentId)
    && (!paymentMethod || paymentMethod === 'Razorpay' || paymentMethod === 'ONLINE');
  const paid = paymentStatus === 'PAID' || (legacyOnline && !paymentStatus);

  if (paymentMethod === 'COD') {
    const dineIn = orderType === 'DINE_IN';
    const shortLabel = dineIn ? 'Cash' : 'COD';
    const title = paid ? `${shortLabel} · Paid` : dineIn ? 'Cash' : 'Cash on delivery';
    return {
      label: checkout && !dineIn ? 'Cash on Delivery' : title,
      shortLabel,
      tone: paid ? 'paid' : 'pending',
      icon: Banknote,
      title,
    };
  }

  if (paymentMethod === 'ONLINE' || legacyOnline) {
    const title = paid ? 'Online · Paid' : 'Online';
    return {
      label: checkout ? 'Razorpay' : title,
      shortLabel: 'Online',
      tone: paid ? 'paid' : 'neutral',
      icon: CreditCard,
      title,
    };
  }

  return null;
}
