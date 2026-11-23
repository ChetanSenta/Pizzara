import { checkoutLine, freeDeliveryThreshold } from '../utils/checkout';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import margheritaImage from '../assets/margherita.png';
import veggieImage from '../assets/veggie.png';
import bbqChickenImage from '../assets/bbq_chicken.jpeg';
import fourCheeseImage from '../assets/four-cheese.png';
import spicyPaneerImage from '../assets/spicy-paneer.png';
import chickenTikkaImage from '../assets/chicken-tikka.png';
import mexicanImage from '../assets/mexican.png';
import pestoGardenImage from '../assets/pesto-garden.png';
import baconLoversImage from '../assets/bacon-lovers.png';
import pepperoniImage from '../assets/pepperoni.png';
import jainImage from '../assets/jain.png';
import farmhouseImage from '../assets/Farmhouse.png';
import './CartDrawer.css';
import { Pizza } from 'lucide-react';
import useModalFocus from '../hooks/useModalFocus';

const PIZZA_IMAGES = {
  'Margherita Classic': margheritaImage,
  'Veggie Supreme': veggieImage,
  'BBQ Chicken Delight': bbqChickenImage,
  'Four Cheese Delight': fourCheeseImage,
  'Spicy Paneer': spicyPaneerImage,
  'Chicken Tikka': chickenTikkaImage,
  'Mexican Heat': mexicanImage,
  'Pesto Garden': pestoGardenImage,
  'Bacon Lovers': baconLoversImage,
  'Classic Pepperoni': pepperoniImage,
  'Jain Pizza': jainImage,
  'Farmhouse': farmhouseImage,
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11H7L6 9Zm3 2v7h2v-7H9Zm4 0v7h2v-7h-2Z" fill="currentColor" />
  </svg>
);

const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    items,
    open,
    setOpen,
    updateQuantity,
    removeItem,
    subtotal,
    deliveryFee,
    taxes,
    total,
  } = useCart();
  const toast = useToast();
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setRendered(true);
      return;
    }

    if (rendered) {
      setClosing(true);
      closeTimerRef.current = window.setTimeout(() => {
        setClosing(false);
        setRendered(false);
      }, 250);
    }

    return () => window.clearTimeout(closeTimerRef.current);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('cart-drawer-open');
    return () => document.body.classList.remove('cart-drawer-open');
  }, [open]);

  const closeDrawer = () => {
    if (closing) return;
    setClosing(true);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setClosing(false);
      setRendered(false);
      setOpen(false);
    }, 250);
  };

  const drawer = useModalFocus(rendered && open, closeDrawer, { busy: closing, fallbackFocus: '#cart-trigger' });

  if (!rendered) return null;

  const checkout = () => {
    if (closing) return;
    if (!items.length) return;
    const lines = items.map(checkoutLine);
    closeDrawer();
    window.setTimeout(() => {
      navigate('/checkout', { state: {
        items: lines,
        priceBreakdown: { subtotal, deliveryFee, taxes, total },
        fromCart: true,
      } });
    }, 250);
  };

  const freeDeliveryRemaining = subtotal > 0 ? Math.max(0, freeDeliveryThreshold - subtotal) : 0;
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div
      className={`cart-overlay${closing ? ' is-closing' : ''}`}
      onMouseDown={closeDrawer}
      role="presentation"
    >
      <aside
        className={`cart-drawer${closing ? ' is-closing' : ''}`}
        ref={drawer}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cart-header">
          <div>
            <span className="cart-eyebrow">Pizzara</span>
            <h2 id="cart-title">Your Cart</h2>
          </div>
          <button data-initial-focus className="cart-close" aria-label="Close cart" onClick={closeDrawer}>×</button>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-illustration" aria-hidden="true"><Pizza size={48} /></span>
            <h3>Your cart is empty</h3>
            <p>Add a pizza to start your order.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                closeDrawer();
                window.setTimeout(() => navigate('/dashboard'), 250);
              }}
            >
              Browse menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item, index) => {
                const id = item.id || item.name;
                const quantity = Math.min(10, Math.max(1, item.quantity));
                const itemImage = PIZZA_IMAGES[item.name] || item.image || margheritaImage;
                const customizations = item.pizza
                  ? [item.pizza.base, item.pizza.sauce, item.pizza.cheese].filter(Boolean)
                  : [];

                return (
                  <article className="cart-item" key={id}>
                    <div className="cart-image-wrap">
                      <img
                        src={itemImage}
                        alt={item.name}
                        loading={index < 4 ? "eager" : "lazy"}
                        decoding={index < 4 ? undefined : "async"}
                        width="76"
                        height="76"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = margheritaImage;
                        }}
                      />
                    </div>

                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <h3>{item.name}</h3>
                        <strong className="cart-line-total">{currency.format(item.price * quantity)}</strong>
                      </div>
                      {customizations.length > 0 && (
                        <p className="cart-item-details" title={customizations.join(' · ')}>
                          {customizations.join(' · ')}
                        </p>
                      )}
                      {quantity > 1 && (
                        <span className="cart-unit-price">{currency.format(item.price)} each</span>
                      )}
                      <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          disabled={quantity <= 1}
                          onClick={() => updateQuantity(id, quantity - 1)}
                        >
                          −
                        </button>
                        <strong aria-label={`Quantity ${quantity}`}>{quantity}</strong>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          disabled={quantity >= 10}
                          onClick={() => updateQuantity(id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cart-remove"
                      aria-label={`Remove ${item.name}`}
                      title={`Remove ${item.name}`}
                      onClick={() => {
                        removeItem(id);
                        toast.success(`${item.name} removed`);
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </article>
                );
              })}
            </div>

            <footer className="cart-summary">
              <div className="cart-free-delivery-block">
                <div
                  className="cart-free-delivery-track"
                  role="progressbar"
                  aria-label="Progress towards free delivery"
                  aria-valuemin={0}
                  aria-valuemax={freeDeliveryThreshold}
                  aria-valuenow={Math.min(subtotal, freeDeliveryThreshold)}
                >
                  <span style={{ width: `${freeDeliveryProgress}%` }} />
                </div>
                {freeDeliveryRemaining > 0 ? (
                  <p className="cart-free-delivery">
                    Add {currency.format(freeDeliveryRemaining)} more for free delivery
                  </p>
                ) : (
                  <p className="cart-free-delivery earned">Free delivery unlocked</p>
                )}
              </div>
              <div><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
              <div><span>Delivery</span><strong>{currency.format(deliveryFee)}</strong></div>
              <div><span>Taxes (5%)</span><strong>{currency.format(taxes)}</strong></div>
              <div className="cart-total"><span>Total</span><strong>{currency.format(total)}</strong></div>
              <button
                className="btn btn-primary cart-checkout"
                onClick={checkout}
                disabled={items.length === 0}
              >
                Proceed to checkout
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
