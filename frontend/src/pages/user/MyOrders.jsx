import OrderTypeBadge from '../../components/OrderTypeBadge';
import PaymentBadge from '../../components/PaymentBadge';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, cancelOrder, quoteCheckout } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import SearchBar from '../../components/SearchBar';
import PageSkeleton from '../../components/PageSkeleton';
import { ChefHat, ConciergeBell, House, Package, PackageCheck, PackageOpen, Search, Truck, Utensils, XCircle } from 'lucide-react';
import { formatOrderId } from '../../utils/formatOrderId';
import './MyOrders.css';
import { getOrderStatusLabel, getOrderStatusClass, getStatusBadgeClass, orderStatuses as statusSteps, statusFilterLabels } from '../../utils/orderStatus';
import { cartItemFromOrder } from '../../utils/checkout';

const statusIcons = [Package, PackageCheck, ChefHat, Truck, House];

const getEstimatedDelivery = (order) => {
  if (order.status === 'Delivered') return 'Delivered';
  const statusMinutes = {
    'Order Placed': 45,
    'Order Received': 35,
    'In the Kitchen': 25,
    'Sent to Delivery': 12,
  };
  const deliveryTime = new Date(Date.now() + (statusMinutes[order.status] || 45) * 60000);
  return `Estimated ${deliveryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

const MyOrders = () => {
  const toast = useToast();
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const statusChips = useRef(null);
  useEffect(() => {
    const narrowScreen = window.matchMedia('(width < 600px)');
    const alignActiveChip = () => {
      const strip = statusChips.current;
      const active = strip?.querySelector('[aria-pressed="true"]');
      if (narrowScreen.matches && active && strip.scrollWidth > strip.clientWidth) {
        strip.scrollLeft = active.offsetLeft - strip.firstElementChild.offsetLeft;
      }
    };
    alignActiveChip();
    narrowScreen.addEventListener('change', alignActiveChip);
    return () => narrowScreen.removeEventListener('change', alignActiveChip);
  }, [loading, statusFilter]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const queryKey = JSON.stringify([page, statusFilter]);
  const requests = useRef({ key: null, id: 0 });

  const fetchOrders = async () => {
    if (requests.current.key !== queryKey) return;
    const request = ++requests.current.id;
    const isCurrent = () => requests.current.key === queryKey && requests.current.id === request;
    try {
      const { data } = await getMyOrders({
        page,
        limit: 50,
        search: statusFilter === 'All' ? '' : statusFilter,
      });
      if (!isCurrent()) return;
      setOrders(data.orders);
      setPages(data.pages);
    } catch (err) {
      if (!isCurrent()) return;
      console.error(err);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  useEffect(() => {
    requests.current.key = queryKey;
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => {
      clearInterval(interval);
      requests.current.key = null;
      requests.current.id++;
    };
  }, [page, statusFilter]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order and request a refund?')) return;
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to cancel order');
    }
  };

  const handleReorder = async (order) => {
    try {
      const lines = order.items?.length ? order.items : [{ legacyOrderId: order._id, quantity: 1 }];
      const { data } = await quoteCheckout(lines);
      data.items.forEach((item) => addItem(cartItemFromOrder(item)));
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reorder');
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredOrders = query
    ? orders.filter((order) => {
        const haystack = [
          order._id,
          formatOrderId(order._id),
          ...(order.items?.length ? order.items : [{ pizza: order.pizza }]).flatMap(({ name, pizza }) => [
            name, pizza?.base, pizza?.sauce, pizza?.cheese, ...(pizza?.veggies || []),
          ]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
    : orders;

  if (loading) return <PageSkeleton cards={4} type="table" />;

  return (
    <div className="my-orders page container" style={{ paddingTop: '100px' }}>
      <h1><Package size={28} aria-hidden="true" /> My Orders</h1>
      <div className="my-orders-toolbar">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search orders..."
          icon={<Search className="my-orders-search-icon" size={16} aria-hidden="true" />}
        />
        <div ref={statusChips} className="orders-filter" role="group" aria-label="Filter orders by status">
          {['All', ...statusSteps, 'Cancelled'].map((status) => (
            <button
              type="button"
              key={status}
              title={status}
              aria-label={status}
              aria-pressed={statusFilter === status}
              className={`order-filter-btn${statusFilter === status ? ' active' : ''}`}
              onClick={() => { setStatusFilter(status); setPage(1); }}
            >
              {statusFilterLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <p><PackageOpen size={56} aria-hidden="true" /></p>
          <h3>{orders.length === 0 && statusFilter === 'All' && !query ? 'No orders yet' : 'No orders match your filters'}</h3>
          {orders.length === 0 && statusFilter === 'All' && !query ? (
            <Link to="/build-pizza" className="btn btn-primary" style={{ marginTop: 16 }}>
              Build Your First Pizza
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => { setStatusFilter('All'); setSearchQuery(''); setPage(1); }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const currentIdx = statusSteps.indexOf(order.status);
            const isCancelled = Boolean(order.cancelledAt) || order.status === 'Cancelled';
            return (
              <div className={`order-card ${isCancelled ? 'cancelled' : getOrderStatusClass(order.status)}`} key={order._id}>

                {/* Header */}
                <div className="order-header">
                  <span className="order-id">{formatOrderId(order._id)}</span>
                  <div className="order-badge-group">
                    <span className={`badge ${isCancelled ? 'badge-cancelled' : getStatusBadgeClass(order.status)}`}>
                      {order.cancelledAt ? 'Cancelled' : getOrderStatusLabel(order)}
                    </span>
                    <PaymentBadge order={order} />
                    <OrderTypeBadge order={order} />
                  </div>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                <hr className="order-divider" aria-hidden="true" />

                {/* Pizza details */}
                <details className="order-details-collapse" open>
                  <summary>Order details</summary>
                  {(order.items?.length ? order.items : [{ pizza: order.pizza }]).map(({ name, pizza, quantity }, index) => (
                    <Fragment key={index}>
                      {index > 0 && <hr className="order-divider" aria-hidden="true" />}
                      <div className="order-pizza-block">
                        {name && <strong className="order-pizza-name">{name} × {quantity}</strong>}
                        <div className="order-details">
                          <div className="order-detail-item">
                            <span className="order-detail-label">Base</span>
                            <span className="order-detail-value">{pizza.base}</span>
                          </div>
                          <div className="order-detail-item">
                            <span className="order-detail-label">Sauce</span>
                            <span className="order-detail-value">{pizza.sauce}</span>
                          </div>
                          <div className="order-detail-item">
                            <span className="order-detail-label">Cheese</span>
                            <span className="order-detail-value">{pizza.cheese}</span>
                          </div>
                          <div className="order-detail-item">
                            <span className="order-detail-label">Toppings</span>
                            <span className="order-detail-value">
                              {pizza.veggies?.length > 0 ? pizza.veggies.join(', ') : 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </details>

                <hr className="order-divider" aria-hidden="true" />

                {/* Stepper */}
                {!isCancelled && (
                  <div
                    className="status-timeline"
                    role="list"
                    aria-label={`Order status: ${getOrderStatusLabel(order)}`}
                  >
                    {statusSteps.map((step, i) => (
                      <div
                        className="status-step-wrap"
                        key={step}
                        role="listitem"
                        aria-label={`${step}${i < currentIdx ? ', completed' : i === currentIdx ? ', current' : ', pending'}`}
                        aria-current={i === currentIdx ? 'step' : undefined}
                      >
                        <div
                          className={`status-dot ${i < currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}`}
                          title={step}
                          aria-hidden="true"
                        >
                          {(() => {
                            const Icon = order.orderType === 'DINE_IN'
                              ? ({ 'Sent to Delivery': ConciergeBell, Delivered: Utensils }[step] || statusIcons[i])
                              : statusIcons[i];
                            return <Icon size={16} aria-hidden="true" />;
                          })()}
                        </div>
                        <span className="status-step-label" title={getOrderStatusLabel(order, step)}>
                          {getOrderStatusLabel(order, step).replace('Order ', '')}
                        </span>
                        {i < statusSteps.length - 1 && (
                          <div className={`status-line ${i < currentIdx ? 'done' : ''}`} aria-hidden="true" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isCancelled && <hr className="order-divider" aria-hidden="true" />}

                {/* Footer */}
                <div className="order-footer">
                  <span className="order-price">₹{order.totalPrice}</span>
                  {!isCancelled && order.status !== 'Delivered' && (
                    <span className="order-estimate">{getEstimatedDelivery(order)}</span>
                  )}
                  <div className="order-actions">
                    {isCancelled && (
                      <div className="cancelled-row" role="status" aria-label="Order cancelled">
                        <XCircle size={16} aria-hidden="true" />
                        <span>Order cancelled</span>
                      </div>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => handleReorder(order)}>Reorder</button>
                    {!isCancelled && (
                      ['Order Placed', 'Order Received'].includes(order.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(order._id)}>Cancel</button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span style={{ alignSelf: 'center' }}>Page {page} of {pages}</span>
          <button className="btn btn-secondary" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
