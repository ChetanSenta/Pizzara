import PaymentBadge from '../../components/PaymentBadge';
import { useEffect, useState } from 'react';
import { getAdminOrderSummary, getAllOrders } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageSkeleton from '../../components/PageSkeleton';
import { AlertTriangle, Clock3, IndianRupee, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatOrderId } from '../../utils/formatOrderId';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const toast = useToast();
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, lowStock: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dailyOrders, setDailyOrders] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError('');
        const [summary, orders] = await Promise.all([
          getAdminOrderSummary({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          getAllOrders({ page: 1, limit: 5 }),
        ]);
        const data = summary.data;
        setStats({
          totalOrders: data.totalOrders,
          pendingOrders: data.pendingOrders,
          lowStock: data.lowStock,
          revenue: data.revenue,
        });
        setRecentOrders(orders.data.orders || []);
        setDailyOrders(data.dailyOrders || []);
      } catch (err) {
        console.error(err);
        const message = err.response?.data?.message || 'Unable to load dashboard data';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = window.setInterval(fetchStats, 10000);
    return () => window.clearInterval(interval);
  }, [refreshKey]);

  const maxCount = Math.max(1, ...dailyOrders.map((day) => day.count));

  if (loading) return <PageSkeleton cards={4} type="table" />;

  return (
    <div className="admin-dash page container" style={{ paddingTop: '100px' }}>
      <h1>Admin Dashboard</h1>
      {error && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <p style={{ color: 'var(--error)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1); }}>
            Retry
          </button>
        </div>
      )}

      <div className="admin-stats">
        <Link to="/admin/orders" className="stat-card" aria-label={`${stats.totalOrders} total orders — view orders`}>
          <div className="stat-icon"><Package size={28} aria-hidden="true" /></div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </Link>
        <Link to="/admin/orders" className="stat-card" aria-label={`${stats.pendingOrders} pending orders — view orders`}>
          <div className="stat-icon"><Clock3 size={28} aria-hidden="true" /></div>
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-label">Pending Orders</div>
        </Link>
        <Link to="/admin/inventory" className="stat-card" aria-label={`${stats.lowStock} low stock items — view inventory`}>
          <div className="stat-icon"><AlertTriangle size={28} aria-hidden="true" /></div>
          <div className="stat-value" style={{color: stats.lowStock > 0 ? 'var(--error)' : 'var(--success)'}}>{stats.lowStock}</div>
          <div className="stat-label">Low Stock Items</div>
        </Link>
        <Link to="/admin/orders" className="stat-card" aria-label={`₹${stats.revenue} total revenue — view orders`}>
          <div className="stat-icon"><IndianRupee size={28} aria-hidden="true" /></div>
          <div className="stat-value" style={{color:'var(--warning)'}}>₹{stats.revenue}</div>
          <div className="stat-label">Total Revenue</div>
        </Link>
      </div>

      <div className="admin-charts">
        <section className="admin-chart-card">
          <div>
            <span>Overview</span>
            <h2>Order activity</h2>
          </div>
          <div className="activity-bars" aria-label="Recent order activity">
            {dailyOrders.map((day, index) => {
              const height = day.count === 0 ? '3px' : `${(day.count / maxCount) * 80}%`;
              return (
                <div className="activity-bar-item" key={day.date}>
                  <div className="activity-bar-track">
                    <div className={`activity-bar-column${day.count === 0 ? ' is-empty' : ''}`} style={{ height }}>
                      <strong className="activity-bar-count">{day.count}</strong>
                      <span
                        className="activity-bar"
                        tabIndex={0}
                        aria-label={`${day.label}: ${day.count} orders`}
                      >
                        <span className="activity-bar-tooltip" role="tooltip">
                          {day.label}: {day.count} orders
                        </span>
                      </span>
                    </div>
                  </div>
                  <small className={index === dailyOrders.length - 1 ? 'activity-day-today' : undefined}>{day.label}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="recent-orders-card">
          <div className="recent-orders-header">
            <div>
              <span>Latest activity</span>
              <h2>Recent orders</h2>
            </div>
            <Link className="recent-view-all" to="/admin/orders">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="recent-orders-empty">No recent orders.</p>
          ) : (
            <div className="recent-orders-table-wrap">
              <div className="recent-orders-table">
                <div className="recent-orders-row recent-orders-labels">
                  <span>Order</span><span>Customer</span><span>Status</span><span>Payment</span><span>Total</span>
                </div>
                {recentOrders.map((order) => {
                  const customer = order.user?.name || 'Customer';
                  const summary = order.items?.map((item) => `${item.name} × ${item.quantity}`).join(' · ');
                  return (
                    <div className="recent-orders-row" key={order._id}>
                      <strong>{formatOrderId(order._id)}</strong>
                      <div className="recent-customer">
                        <span title={customer}>{customer}</span>
                        {summary && <small title={summary}>{summary}</small>}
                      </div>
                      <span className={`recent-status status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span>
                      <div><PaymentBadge order={order} short /></div>
                      <strong>₹{order.totalPrice}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
};

export default AdminDashboard;
