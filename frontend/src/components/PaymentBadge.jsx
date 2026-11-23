import { getPaymentLabel } from '../utils/paymentLabel';
import './PaymentBadge.css';

export default function PaymentBadge({ order, short = false }) {
  const payment = getPaymentLabel(order);
  if (!payment) return null;

  const { label, shortLabel, tone, icon: Icon, title } = payment;
  return (
    <span className={`payment-badge payment-${tone}`} role="img" title={title} aria-label={title}>
      <Icon size={14} aria-hidden="true" />
      {short ? <span>{shortLabel}</span> : label}
    </span>
  );
}
