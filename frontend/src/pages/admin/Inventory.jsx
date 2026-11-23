import { useEffect, useRef, useState } from 'react';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SearchBar from '../../components/SearchBar';
import PageSkeleton from '../../components/PageSkeleton';
import useModalFocus from '../../hooks/useModalFocus';
import { ArrowDown, ArrowDownUp, ArrowUp, LayoutGrid, List, Minus, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import './Inventory.css';

const categories = ['all', 'base', 'sauce', 'cheese', 'veggie', 'meat'];
const viewKey = 'pizzara-inventory-view';
const isLowStock = (item) => item.quantity < 20;
const columns = [
  { key: 'name', label: 'Item', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'quantity', label: 'Stock', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

const Inventory = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sort, setSort] = useState(null);
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(viewKey) === 'grid' ? 'grid' : 'table';
    } catch {
      return 'table';
    }
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ category: 'base', name: '', quantity: 100, price: 0, image: '🍕' });
  const [search, setSearch] = useState('');
  const [deleteItem, setDeleteItem] = useState(null);
  const [savingId, setSavingId] = useState('');
  const [savedId, setSavedId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const modalTrigger = useRef(null);
  const addTrigger = useRef(null);
  const filterTabs = useRef(null);
  const closeEdit = () => { if (!submitting) setShowModal(false); };
  const closeDelete = () => { if (!deleting) setDeleteItem(null); };
  const editDialog = useModalFocus(showModal, closeEdit, { busy: submitting, initialFocus: '#inventory-name', returnFocus: modalTrigger });
  const deleteDialog = useModalFocus(Boolean(deleteItem), closeDelete, { busy: deleting, returnFocus: modalTrigger });
  const stockTimers = useRef({});
  const savedTimers = useRef({});
  const latestQuantities = useRef({});

  const fetchItems = async () => {
    try {
      const { data } = await getInventory();
      setItems(data);
      latestQuantities.current = {};
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => () => {
    Object.values(stockTimers.current).forEach((timer) => window.clearTimeout(timer));
    Object.values(savedTimers.current).forEach((timer) => window.clearTimeout(timer));
  }, []);
  useEffect(() => {
    const tabs = filterTabs.current;
    if (!tabs) return;
    const narrowToolbar = window.matchMedia('(width < 1100px)');
    const revealActiveChip = () => {
      if (!narrowToolbar.matches) return;
      const active = tabs.querySelector('[aria-pressed="true"]');
      if (active) tabs.scrollLeft = active.offsetLeft;
    };
    revealActiveChip();
    narrowToolbar.addEventListener('change', revealActiveChip);
    return () => narrowToolbar.removeEventListener('change', revealActiveChip);
  }, [activeFilter, loading]);

  const lowStockCount = items.filter(isLowStock).length;
  const noLowStock = activeFilter === 'low' && lowStockCount === 0;
  const filtered = items.filter((item) => {
    const matchesFilter = activeFilter === 'low'
      ? isLowStock(item)
      : activeFilter === 'all' || item.category === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (sort) {
    filtered.sort((first, second) => {
      const comparison = sort.key === 'name'
        ? first.name.localeCompare(second.name)
        : first[sort.key] - second[sort.key];
      return comparison * sort.direction;
    });
  }

  const changeSort = (key) => {
    setSort((current) => ({
      key,
      direction: current?.key === key ? -current.direction : 1,
    }));
  };

  const changeView = (nextView) => {
    setView(nextView);
    try {
      localStorage.setItem(viewKey, nextView);
    } catch {
      // Keep the selected view for this session if storage is unavailable.
    }
  };

  const getQtyClass = (qty) => qty < 10 ? 'low' : qty < 20 ? 'warn' : 'ok';

  const openAdd = (event) => {
    modalTrigger.current = event.currentTarget;
    setEditItem(null);
    setForm({ category: 'base', name: '', quantity: 100, price: 0, image: '🍕' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (item, trigger) => {
    modalTrigger.current = trigger;
    setEditItem(item);
    setForm({ category: item.category, name: item.name, quantity: item.quantity, price: item.price, image: item.image });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Item name is required';
    if (!Number.isFinite(form.quantity) || form.quantity < 0) nextErrors.quantity = 'Quantity must be 0 or more';
    if (!Number.isFinite(form.price) || form.price < 0) nextErrors.price = 'Price must be 0 or more';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      if (editItem) {
        await updateInventoryItem(editItem._id, form);
        toast.success('Item updated');
      } else {
        await addInventoryItem(form);
        toast.success('Item added');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteInventoryItem(id);
      toast.success('Item deleted');
      modalTrigger.current = addTrigger.current;
      setDeleteItem(null);
      fetchItems();
    } catch (err) {
      toast.error('Error deleting item');
    } finally {
      setDeleting(false);
    }
  };

  const updateStock = (item, delta) => {
    const currentQuantity = latestQuantities.current[item._id] ?? item.quantity;
    const quantity = Math.max(0, currentQuantity + delta);
    if (quantity === currentQuantity) return;

    latestQuantities.current[item._id] = quantity;
    setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, quantity } : entry));
    setSavingId(item._id);
    setSavedId('');
    window.clearTimeout(savedTimers.current[item._id]);
    window.clearTimeout(stockTimers.current[item._id]);
    stockTimers.current[item._id] = window.setTimeout(async () => {
      const latestQuantity = latestQuantities.current[item._id] ?? quantity;
      try {
        await updateInventoryItem(item._id, { ...item, quantity: latestQuantity });
        toast.success(`Stock updated to ${latestQuantity}`);
        setSavingId('');
        setSavedId(item._id);
        savedTimers.current[item._id] = window.setTimeout(() => setSavedId(''), 1600);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Unable to update stock');
        setSavingId('');
        setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, quantity: item.quantity } : entry));
        latestQuantities.current[item._id] = item.quantity;
      }
    }, 450);
  };

  const renderStockFeedback = (item) => (
    <span className="inv-stock-feedback" role="status">
      {savingId === item._id && 'Saving…'}
      {savedId === item._id && savingId !== item._id && 'Saved'}
    </span>
  );

  const renderStockControls = (item, iconSize) => (
    <div className="stock-controls" role="group" aria-label={`${item.name} stock`}>
      <button type="button" aria-label={`Decrease ${item.name} stock`} disabled={item.quantity <= 0} onClick={() => updateStock(item, -1)}>
        <Minus size={iconSize} aria-hidden="true" />
      </button>
      <output className="inv-stock-value" data-empty={item.quantity === 0 || undefined} aria-label={`${item.name} stock quantity`}>
        {item.quantity}
      </output>
      <button type="button" aria-label={`Increase ${item.name} stock`} onClick={() => updateStock(item, 1)}>
        <Plus size={iconSize} aria-hidden="true" />
      </button>
    </div>
  );

  const renderActions = (item, iconSize) => (
    <div className="inv-card-actions">
      <button type="button" className="btn inventory-edit" onClick={(event) => openEdit(item, event.currentTarget)} aria-label={`Edit ${item.name}`}>
        <Pencil size={iconSize} aria-hidden="true" /> Edit
      </button>
      <button type="button" className="btn inventory-delete" onClick={(event) => { modalTrigger.current = event.currentTarget; setDeleteItem(item); }} aria-label={`Delete ${item.name}`}>
        <Trash2 size={iconSize} aria-hidden="true" /> Delete
      </button>
    </div>
  );

  if (loading) return <PageSkeleton cards={8} />;

  return (
    <div className="inventory-page page container" style={{ paddingTop: '100px' }}>
      <div className="inventory-header">
        <h1><Package size={28} aria-hidden="true" /> Inventory Management</h1>
        <div className="inventory-header-actions">
          <div className="inventory-view-toggle" role="group" aria-label="Inventory view">
            <button type="button" aria-label="Table view" title="Table view" aria-pressed={view === 'table'} onClick={() => changeView('table')}>
              <List size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Grid view" title="Grid view" aria-pressed={view === 'grid'} onClick={() => changeView('grid')}>
              <LayoutGrid size={18} aria-hidden="true" />
            </button>
          </div>
          <button className="btn btn-primary" ref={addTrigger} data-modal-fallback onClick={openAdd}><Plus size={18} aria-hidden="true" /> Add Item</button>
        </div>
      </div>

      <div className="inventory-toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search inventory..."
          icon={<Search className="inventory-search-icon" size={16} aria-hidden="true" />}
        />
        <div className="inventory-tabs" ref={filterTabs} role="group" aria-label="Filter inventory">
          {categories.map(c => (
            <button key={c} type="button" aria-pressed={activeFilter === c} className={`inv-tab ${activeFilter === c ? 'active' : ''}`} onClick={() => setActiveFilter(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)} ({c === 'all' ? items.length : items.filter(i => i.category === c).length})
            </button>
          ))}
          <button type="button" className={`inv-tab${activeFilter === 'low' ? ' active' : ''}`} aria-pressed={activeFilter === 'low'} onClick={() => setActiveFilter('low')}>
            Low stock ({lowStockCount})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <h3>{noLowStock ? 'No items are low on stock' : 'No items match your search'}</h3>
          {noLowStock ? (
            <button className="btn btn-secondary" onClick={() => setActiveFilter('all')}>Show all</button>
          ) : (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setActiveFilter('all'); }}>Clear search</button>
          )}
        </div>
      ) : view === 'table' ? (
        <div className="inventory-table-container" role="region" aria-label="Scrollable inventory" tabIndex={0}>
          <table className="inventory-table" role="table" aria-label="Inventory">
            <thead role="rowgroup">
              <tr role="row">
                {columns.map(({ key, label, sortable }) => {
                  const direction = sort?.key === key ? sort.direction : null;
                  const SortIcon = direction === 1 ? ArrowUp : direction === -1 ? ArrowDown : ArrowDownUp;
                  return (
                    <th key={key} className={`inv-col-${key}`} role="columnheader" scope="col"
                      aria-sort={direction === 1 ? 'ascending' : direction === -1 ? 'descending' : undefined}>
                      {sortable ? (
                        <button type="button" className="inventory-sort" onClick={() => changeSort(key)}>
                          {label} <SortIcon size={14} aria-hidden="true" />
                        </button>
                      ) : label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {filtered.map((item) => (
                <tr key={item._id} className={getQtyClass(item.quantity)} role="row">
                  <th className="inv-col-name" role="rowheader" scope="row">
                    <span className="inventory-table-item">
                      <span className="inventory-table-emoji" aria-hidden="true">{item.image}</span>
                      <span className="inventory-table-name" title={item.name}>{item.name}</span>
                    </span>
                  </th>
                  <td className="inv-col-category" role="cell"><span className="inv-card-cat">{item.category}</span></td>
                  <td className="inv-col-price" role="cell">₹{item.price}</td>
                  <td className="inv-col-quantity" role="cell">
                    <div className="inventory-stock-stepper">
                      {renderStockControls(item, 14)}
                      {renderStockFeedback(item)}
                    </div>
                  </td>
                  <td className="inv-col-status" role="cell">
                    <span className="inventory-stock-status">{isLowStock(item) ? 'Low stock' : 'In stock'}</span>
                  </td>
                  <td className="inv-col-actions" role="cell">{renderActions(item, 14)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="inventory-grid">
          {filtered.map((item) => (
            <div className={`inv-card ${getQtyClass(item.quantity)}`} key={item._id}>
              <div className="inv-card-header">
                <span className="inv-card-icon" aria-hidden="true">{item.image}</span>
                <h3 title={item.name}>{item.name}</h3>
                <span className="inv-card-cat">{item.category}</span>
              </div>
              <div className="inv-card-info">
                <span className="inv-card-price">
                  <strong>₹{item.price}</strong> <small>per item</small>
                </span>
                {isLowStock(item) && <span className="inventory-stock-status">Low stock</span>}
              </div>
              <div className="inv-card-stock">
                <span className="inv-card-stock-label">Stock</span>
                <div className="inventory-stock-stepper">
                  {renderStockControls(item, 16)}
                </div>
                {renderStockFeedback(item)}
              </div>
              {renderActions(item, 16)}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div
            className="modal-card"
            ref={editDialog}
            tabIndex={-1}
            aria-busy={submitting}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="inventory-modal-title">{editItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button
                type="button"
                className="modal-close"
                disabled={submitting}
                aria-label="Close"
                onClick={closeEdit}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {!editItem && (
                <div className="form-group">
                  <label htmlFor="inventory-category">Category</label>
                  <select id="inventory-category" className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="base">Base</option>
                    <option value="sauce">Sauce</option>
                    <option value="cheese">Cheese</option>
                    <option value="veggie">Veggie</option>
                    <option value="meat">Meat</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="inventory-name">Name</label>
                <input
                  id="inventory-name"
                  className="form-input"
                  value={form.name}
                  aria-invalid={Boolean(formErrors.name)}
                  aria-describedby={formErrors.name ? 'inventory-name-error' : undefined}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
                {formErrors.name && <small className="form-error" id="inventory-name-error" role="alert">{formErrors.name}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="inventory-quantity">Quantity</label>
                <input
                  id="inventory-quantity"
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.quantity}
                  aria-invalid={Boolean(formErrors.quantity)}
                  aria-describedby={formErrors.quantity ? 'inventory-quantity-error' : undefined}
                  onChange={e => setForm({ ...form, quantity: parseInt(e.target.value, 10) || 0 })}
                  required
                />
                {formErrors.quantity && <small className="form-error" id="inventory-quantity-error" role="alert">{formErrors.quantity}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="inventory-price">Price (₹)</label>
                <input
                  id="inventory-price"
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.price}
                  aria-invalid={Boolean(formErrors.price)}
                  aria-describedby={formErrors.price ? 'inventory-price-error' : undefined}
                  onChange={e => setForm({ ...form, price: parseInt(e.target.value, 10) || 0 })}
                  required
                />
                {formErrors.price && <small className="form-error" id="inventory-price-error" role="alert">{formErrors.price}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="inventory-image">Emoji Icon</label>
                <input id="inventory-image" className="form-input" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editItem ? 'Update' : 'Add'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeEdit} disabled={submitting}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="modal-overlay" onClick={closeDelete}>
          <div
            className="modal-card delete-modal"
            ref={deleteDialog}
            tabIndex={-1}
            aria-busy={deleting}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-modal-title">Delete {deleteItem.name}?</h2>
            <p id="delete-modal-description">This inventory item will be permanently removed.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(deleteItem._id)} disabled={deleting}>Delete item</button>
              <button type="button" className="btn btn-secondary" onClick={closeDelete} data-initial-focus disabled={deleting}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
