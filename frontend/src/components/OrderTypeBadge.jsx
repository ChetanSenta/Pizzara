import { Store, Truck } from 'lucide-react';
import './OrderTypeBadge.css';

export default function OrderTypeBadge({ order }) {
  const dineIn = order.orderType === 'DINE_IN';
  const Icon = dineIn ? Store : Truck;
  return (
    <span className="order-type-badge">
      <Icon size={14} aria-hidden="true" />
      {dineIn ? 'Eat in shop' : 'Home delivery'}
    </span>
  );
}
