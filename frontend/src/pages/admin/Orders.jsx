import OrderTypeBadge from '../../components/OrderTypeBadge';
import PaymentBadge from '../../components/PaymentBadge';
import { Fragment, useEffect, useRef, useState } from 'react';
import { getAllOrders, getAdminOrderSummary, updateOrderStatus } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SearchBar from '../../components/SearchBar';
import PageSkeleton from '../../components/PageSkeleton';
import { Phone, Search, ShoppingBag } from 'lucide-react';
import { formatOrderId } from '../../utils/formatOrderId';
import './Orders.css';
import { getOrderStatusLabel, getStatusBadgeClass, orderStatuses as statusOptions, statusFilterLabels } from '../../utils/orderStatus';
import useModalFocus from '../../hooks/useModalFocus';
import { createPortal } from 'react-dom';

const isShortIdSearch = (value) => {
  const query = value.trim();
  return /^#[a-f0-9]{4,24}$/i.test(query) || /^[a-f0-9]{8,24}$/i.test(query);
};

const statusFilters = ['All', ...statusOptions];
const isFinalStatus = (status) => status === 'Delivered' || status === 'Cancelled';

const statusColors = {
  'Order Placed': 'var(--info)',
  'Order Received': 'var(--warning)',
  'In the Kitchen': 'var(--primary)',
  'Sent to Delivery': 'var(--purple)',
  Delivered: 'var(--success)',
};

const localOrderDate = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit',
});

const Orders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const activeFilterTab = useRef(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [updatingId, setUpdatingId] = useState('');
  const [deliveryOrder, setDeliveryOrder] = useState(null);
  const deliveryTrigger = useRef(null);
  const closeDelivery = () => { if (!updatingId) setDeliveryOrder(null); };
  const deliveryDialog = useModalFocus(Boolean(deliveryOrder), closeDelivery, { busy: Boolean(updatingId), returnFocus: deliveryTrigger, fallbackFocus: '.order-filter-btn.active' });
  const [dateFilter, setDateFilter] = useState('');
  const dateField = useRef(null);
  const [counts, setCounts] = useState({ all: 0, byStatus: {} });

  const queryKey = JSON.stringify([page, filter, search]);
  const requests = useRef({ key: null, id: 0 });

  const fetchOrders = async () => {
    if (requests.current.key !== queryKey) return;
    const request = ++requests.current.id;
    const isCurrent = () => requests.current.key === queryKey && requests.current.id === request;
    try {
      const idSearch = isShortIdSearch(search);
      const [{ data }, summary] = await Promise.all([
        getAllOrders({
          page: idSearch ? 1 : page,
          limit: idSearch ? 100 : 20,
          status: filter,
          search: idSearch ? '' : search,
        }),
        getAdminOrderSummary().catch(() => null),
      ]);
      if (!isCurrent()) return;
      setOrders(data.orders);
      setPages(data.pages);
      if (summary?.data) {
        setCounts({
          all: summary.data.totalOrders || 0,
          byStatus: summary.data.statusCounts || {},
        });
      }
    } catch (err) {
      if (!isCurrent()) return;
      toast.error('Failed to load orders');
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  useEffect(() => {
    const tab = activeFilterTab.current;
    const strip = tab?.parentElement;
    if (strip && strip.scrollWidth > strip.clientWidth) {
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [filter, loading]);
  useEffect(() => {
    requests.current.key = queryKey;
    fetchOrders();
    const interval = window.setInterval(fetchOrders, 10000);
    return () => {
      window.clearInterval(interval);
      requests.current.key = null;
      requests.current.id++;
    };
  }, [page, filter, search]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === 'Cancelled' && !window.confirm('Cancel this order? This cannot be undone.')) return;
    setUpdatingId(orderId);
    try {
      const { data } = await updateOrderStatus(orderId, newStatus);
      setOrders((current) => current.map((order) => (
        order._id === orderId ? { ...order, status: data.status, paymentStatus: data.paymentStatus } : order
      )));
      toast.success(`Status updated to "${getOrderStatusLabel(data, newStatus)}"`);
      if (newStatus === 'Delivered') setDeliveryOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      fetchOrders();
    } finally {
      setUpdatingId('');
    }
  };

  const filtered = orders.filter((order) => {
    const statusMatch = filter === 'All' || order.status === filter;
    const dateMatch = !dateFilter || localOrderDate.format(new Date(order.createdAt)) === dateFilter;
    const idQuery = search.trim().replace(/^#/, '').toLowerCase();
    const idMatch = !isShortIdSearch(search) || order._id.toLowerCase().endsWith(idQuery);
    return statusMatch && dateMatch && idMatch;
  });

  const countFor = (status) => {
    if (status === 'All') return counts.all || orders.length;
    return counts.byStatus[status] ?? orders.filter((order) => order.status === status).length;
  };

  if (loading) return <PageSkeleton cards={5} type="table" />;

  const displayedDate = dateFilter
    ? dateFilter.split('-').reverse().join('/')
    : new Date().toLocaleDateString('en-GB');

  return (
    <div className="admin-orders page container" style={{ paddingTop: '100px' }}>
      <h1><ShoppingBag size={30} aria-hidden="true" /> Order Management</h1>
      <div className="orders-toolbar">
        <SearchBar
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search pizza, city, or postal code..."
          icon={<Search className="orders-search-icon" size={16} strokeWidth={2} aria-hidden="true" />}
        />
        <div ref={dateField} tabIndex={-1} className={`orders-date-field${dateFilter ? ' has-date' : ''}`}>
          <input
            className="orders-date-filter"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter by date"
            title="Filter by date"
          />
          <span className="orders-date-display" aria-hidden="true">{displayedDate}</span>
          {dateFilter && (
            <button
              type="button"
              className="orders-date-clear"
              aria-label="Clear date filter"
              onClick={() => { setDateFilter(''); dateField.current?.focus(); }}
            >
              ×
            </button>
          )}
        </div>
        <div className="orders-filter" role="group" aria-label="Filter orders by status">
          {statusFilters.map(s => {
            const count = countFor(s);
            const active = filter === s;
            return (
              <button
                key={s}
                ref={active ? activeFilterTab : null}
                type="button"
                className={`order-filter-btn${active ? ' active' : ''}`}
                title={s}
                aria-label={`${s}, ${count}`}
                aria-pressed={active}
                onClick={() => { setFilter(s); setPage(1); }}
              >
                {statusFilterLabels[s]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <h3>No orders match your filters</h3>
          <p>Try a different status, date, or search term.</p>
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilter('All'); setDateFilter(''); setPage(1); }}>Clear filters</button>
        </div>
      ) : (
        filtered.map(order => (
          <div className="admin-order-card" key={order._id}>
            <div className="admin-order-header">
              <div className="admin-order-customer">
                <div className="admin-order-identity">
                  <strong title={order.user?.name}>{order.user?.name || 'Unknown'}</strong>
                  <span className="admin-order-id">{formatOrderId(order._id)}</span>
                </div>
                <div className="admin-order-contact">
                  {(order.contact?.phone || order.deliveryAddress?.phone) && (
                    <small className="admin-order-phone"><Phone size={14} aria-hidden="true" />{order.contact?.phone || order.deliveryAddress?.phone}</small>
                  )}
                  <small>{new Date(order.createdAt).toLocaleString('en-IN')}</small>
                </div>
              </div>
              <div className="order-badge-group">
                <span className={`badge ${getStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order)}</span>
                <PaymentBadge order={order} />
                <OrderTypeBadge order={order} />
              </div>
            </div>

            {(order.items?.length ? order.items : [{ pizza: order.pizza }]).map(({ name, pizza, quantity }, index) => (
              <Fragment key={index}>
                {name && <strong className="admin-order-pizza-name">{name} × {quantity}</strong>}
                <div className="admin-order-pizza">
                  <div><span>Base</span>{pizza.base}</div>
                  <div><span>Sauce</span>{pizza.sauce}</div>
                  <div><span>Cheese</span>{pizza.cheese}</div>
                  <div><span>Toppings</span>{pizza.veggies?.join(', ') || 'None'}</div>
                </div>
              </Fragment>
            ))}

            <div className="admin-order-footer">
              <span>₹{order.totalPrice}</span>
              <div className="admin-order-status-group">
                <label htmlFor={`status-${order._id}`}>Status:</label>
                <select
                  id={`status-${order._id}`}
                  className="status-select"
                  value={order.status}
                  disabled={updatingId === order._id || isFinalStatus(order.status)}
                  title={isFinalStatus(order.status) ? 'Final status' : undefined}
                  aria-busy={updatingId === order._id}
                  onChange={(e) => {
                    if (e.target.value === 'Delivered') {
                      deliveryTrigger.current = e.currentTarget;
                      setDeliveryOrder(order);
                    } else {
                      handleStatusChange(order._id, e.target.value);
                    }
                  }}
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s} style={{ color: statusColors[s] }}>
                      {getOrderStatusLabel(order, s)}
                    </option>
                  ))}
                  {order.status === 'Cancelled' && (
                    <option value="Cancelled" style={{ color: 'var(--error)' }}>Cancelled</option>
                  )}
                </select>
                {updatingId === order._id && <span className="status-saving" role="status">Saving…</span>}
              </div>
            </div>
          </div>
        ))
      )}
      {deliveryOrder && createPortal(
        <div className="order-confirm-backdrop" onClick={closeDelivery}>
          <section className="order-confirm-dialog" ref={deliveryDialog} tabIndex={-1} role="dialog"
            aria-modal="true" aria-labelledby="order-confirm-title" aria-describedby="order-confirm-description"
            aria-busy={Boolean(updatingId)} onClick={(event) => event.stopPropagation()}>
            <h2 id="order-confirm-title">Mark this order as {getOrderStatusLabel(deliveryOrder, 'Delivered')}?</h2>
            <p id="order-confirm-description">This cannot be undone.</p>
            <div className="order-confirm-actions">
              <button type="button" className="btn btn-secondary" data-initial-focus disabled={Boolean(updatingId)} onClick={closeDelivery}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={Boolean(updatingId)} onClick={() => handleStatusChange(deliveryOrder._id, 'Delivered')}>
                {updatingId ? 'Saving…' : getOrderStatusLabel(deliveryOrder, 'Delivered')}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
      {pages > 1 && !isShortIdSearch(search) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span style={{ alignSelf: 'center' }}>Page {page} of {pages}</span>
          <button className="btn btn-secondary" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Orders;
